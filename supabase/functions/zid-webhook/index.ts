import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Zid-Store-Id, X-Zid-HMAC-SHA256",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Map Zid order status to our internal status
function mapZidStatus(zidStatus: string): string {
  const map: Record<string, string> = {
    "new": "pending",
    "pending": "pending",
    "confirmed": "processing",
    "processing": "processing",
    "ready_for_shipping": "processing",
    "shipped": "shipped",
    "delivered": "delivered",
    "cancelled": "cancelled",
    "refunded": "returned",
  };
  return map[zidStatus?.toLowerCase()] || "pending";
}

// Map Zid payment method / channel to our source
function mapZidChannel(order: Record<string, unknown>): string {
  const channel = (order.channel as string)?.toLowerCase() || "";
  if (channel.includes("instagram")) return "instagram";
  if (channel.includes("snapchat")) return "snapchat";
  if (channel.includes("tiktok")) return "tiktok";
  if (channel.includes("google")) return "google";
  if (channel.includes("whatsapp")) return "whatsapp";
  return "direct";
}

async function processOrderCreated(order: Record<string, unknown>, storeId: string) {
  const orderId = String(order.id || order.order_number || "");
  const total = Number(order.total || order.payment_amount || 0);
  const status = mapZidStatus(String(order.status || "new"));
  const source = mapZidChannel(order);
  const customerName = String(
    (order.customer as Record<string, unknown>)?.name || order.customer_name || ""
  );
  const customerEmail = String(
    (order.customer as Record<string, unknown>)?.email || order.customer_email || ""
  );
  const itemsCount = Number(
    Array.isArray(order.products) ? order.products.length : order.items_count || 1
  );

  // Upsert order
  const { error } = await supabase.from("orders").upsert({
    order_id: `ZID-${orderId}`,
    customer_name: customerName || null,
    customer_email: customerEmail || null,
    total,
    items_count: itemsCount,
    status,
    source,
    returned: false,
    created_at: order.created_at as string || new Date().toISOString(),
  }, { onConflict: "order_id" });

  if (error) throw error;

  // Update today's metrics
  const today = new Date().toISOString().slice(0, 10);
  await supabase.rpc("increment_daily_orders", {
    p_date: today,
    p_revenue: total,
    p_orders: 1,
  }).maybeSingle();
}

async function processOrderUpdated(order: Record<string, unknown>) {
  const orderId = `ZID-${order.id || order.order_number}`;
  const status = mapZidStatus(String(order.status || ""));
  const returned = status === "returned";

  await supabase.from("orders").update({ status, returned }).eq("order_id", orderId);
}

async function processOrderRefunded(order: Record<string, unknown>) {
  const orderId = `ZID-${order.id || order.order_number}`;
  await supabase.from("orders").update({ status: "cancelled", returned: true }).eq("order_id", orderId);
}

async function processCartAbandoned(cart: Record<string, unknown>, storeId: string) {
  const customer = cart.customer as Record<string, unknown> | undefined;
  const products = cart.products as unknown[] | undefined;

  await supabase.from("abandoned_carts").insert({
    session_id: String(cart.session_id || cart.id || ""),
    customer_email: String(customer?.email || ""),
    customer_name: String(customer?.name || ""),
    cart_value: Number(cart.total || cart.value || 0),
    items_count: Array.isArray(products) ? products.length : Number(cart.items_count || 1),
    abandoned_at: new Date().toISOString(),
    recovered: false,
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const storeId = req.headers.get("X-Zid-Store-Id") || "";
    const hmac = req.headers.get("X-Zid-HMAC-SHA256") || "";
    const body = await req.text();

    // Log raw event first
    let payload: Record<string, unknown> = {};
    let eventType = "unknown";

    try {
      payload = JSON.parse(body);
      eventType = String(payload.event || payload.type || "unknown");
    } catch {
      // non-JSON body
    }

    await supabase.from("zid_webhook_events").insert({
      event_type: eventType,
      zid_event_id: String(payload.id || ""),
      store_id: storeId,
      payload,
      processed: false,
      received_at: new Date().toISOString(),
    });

    // Process by event type
    const data = (payload.data || payload.order || payload.cart || payload) as Record<string, unknown>;

    switch (eventType) {
      case "order.created":
      case "order_created":
        await processOrderCreated(data, storeId);
        break;
      case "order.updated":
      case "order_updated":
        await processOrderUpdated(data);
        break;
      case "order.refunded":
      case "order_refunded":
      case "order.cancelled":
        await processOrderRefunded(data);
        break;
      case "cart.abandoned":
      case "cart_abandoned":
        await processCartAbandoned(data, storeId);
        break;
      default:
        // Unknown event — logged, not processed
    }

    // Mark event as processed
    await supabase
      .from("zid_webhook_events")
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq("store_id", storeId)
      .is("processed_at", null)
      .order("received_at", { ascending: false })
      .limit(1);

    // Update last_sync_at on connection
    await supabase
      .from("zid_connection")
      .update({ last_sync_at: new Date().toISOString(), last_sync_status: "success" })
      .eq("store_id", storeId);

    return new Response(JSON.stringify({ received: true, event: eventType }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
