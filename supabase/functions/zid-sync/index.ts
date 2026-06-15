import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const ZID_API_BASE = "https://api.zid.sa/v1";

function mapStatus(s: string): string {
  const m: Record<string, string> = {
    new: "pending", pending: "pending", confirmed: "processing",
    processing: "processing", ready_for_shipping: "processing",
    shipped: "shipped", delivered: "delivered",
    cancelled: "cancelled", refunded: "returned",
  };
  return m[s?.toLowerCase()] || "pending";
}

function mapSource(order: Record<string, unknown>): string {
  const ch = String(order.channel || order.source || "").toLowerCase();
  if (ch.includes("instagram")) return "instagram";
  if (ch.includes("snapchat")) return "snapchat";
  if (ch.includes("tiktok")) return "tiktok";
  if (ch.includes("google")) return "google";
  if (ch.includes("whatsapp")) return "whatsapp";
  return "direct";
}

async function fetchZidOrders(token: string, storeId: string, page = 1, perPage = 50) {
  const resp = await fetch(`${ZID_API_BASE}/managers/profile/orders/?page=${page}&per_page=${perPage}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "X-MANAGER-TOKEN": token,
      "X-MANAGER-STORE-ID": storeId,
      "Accept": "application/json",
      "Accept-Language": "ar",
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Zid API error ${resp.status}: ${text}`);
  }
  return resp.json();
}

async function fetchZidProducts(token: string, storeId: string, page = 1) {
  const resp = await fetch(`${ZID_API_BASE}/products/?page=${page}&per_page=50`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "X-MANAGER-TOKEN": token,
      "X-MANAGER-STORE-ID": storeId,
      "Accept": "application/json",
    },
  });
  if (!resp.ok) throw new Error(`Zid products API error ${resp.status}`);
  return resp.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const { sync_type = "orders", store_id, manager_token, pages = 1 } = await req.json().catch(() => ({}));

  if (!store_id || !manager_token) {
    return new Response(JSON.stringify({ error: "store_id and manager_token are required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Create sync log
  const { data: logRow } = await supabase.from("sync_logs").insert({
    source: "zid",
    sync_type,
    status: "running",
    started_at: new Date().toISOString(),
  }).select().single();
  const logId = logRow?.id;

  let fetched = 0, inserted = 0, updated = 0;

  try {
    if (sync_type === "orders" || sync_type === "all") {
      for (let page = 1; page <= Number(pages); page++) {
        const data = await fetchZidOrders(manager_token, store_id, page);
        const orders: Record<string, unknown>[] = data.orders || data.data || [];
        if (!orders.length) break;
        fetched += orders.length;

        for (const order of orders) {
          const customer = order.customer as Record<string, unknown> | undefined;
          const products = order.products as unknown[] | undefined;
          const orderId = `ZID-${order.id || order.reference_id || order.order_number}`;
          const total = Number(order.payment?.amount || order.total || 0);
          const status = mapStatus(String(order.status || "new"));

          const { error, count } = await supabase.from("orders").upsert({
            order_id: orderId,
            customer_name: String(customer?.name || customer?.first_name || ""),
            customer_email: String(customer?.email || ""),
            total,
            items_count: Array.isArray(products) ? products.length : Number(order.items_count || 1),
            status,
            source: mapSource(order),
            returned: status === "returned",
            created_at: String(order.created_at || new Date().toISOString()),
          }, { onConflict: "order_id", ignoreDuplicates: false });

          if (!error) inserted++;
        }
      }
    }

    if (sync_type === "products" || sync_type === "all") {
      const data = await fetchZidProducts(manager_token, store_id);
      const products: Record<string, unknown>[] = data.products || data.data || [];
      fetched += products.length;

      for (const product of products) {
        const { error } = await supabase.from("products").upsert({
          name: String(product.name || product.name_ar || ""),
          sku: String(product.sku || product.id || ""),
          category: String((product.category as Record<string, unknown>)?.name || "عام"),
          current_stock: Number(product.quantity || product.stock || 0),
          sold_count: Number(product.sold_count || 0),
          return_count: 0,
          revenue: Number(product.price || 0) * Number(product.sold_count || 0),
          featured: Boolean(product.is_featured || false),
        }, { onConflict: "sku" });
        if (!error) inserted++;
      }
    }

    // Update sync log
    await supabase.from("sync_logs").update({
      status: "success",
      records_fetched: fetched,
      records_inserted: inserted,
      records_updated: updated,
      completed_at: new Date().toISOString(),
    }).eq("id", logId);

    // Update connection last sync
    await supabase.from("zid_connection").update({
      last_sync_at: new Date().toISOString(),
      last_sync_status: "success",
      total_synced_orders: supabase.rpc ? fetched : fetched,
    }).eq("store_id", store_id);

    return new Response(JSON.stringify({ success: true, fetched, inserted, updated }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await supabase.from("sync_logs").update({
      status: "error",
      error_message: message,
      completed_at: new Date().toISOString(),
    }).eq("id", logId);
    await supabase.from("zid_connection").update({ last_sync_status: "error" }).eq("store_id", store_id);

    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
