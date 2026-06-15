import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, "").toLowerCase());
  return lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim().replace(/"/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] || ""; });
    return row;
  });
}

function resolveField(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== "") return row[k];
  }
  return "";
}

function mapRowStatus(s: string): string {
  const lower = s.toLowerCase();
  if (lower.includes("مكتمل") || lower.includes("deliver") || lower.includes("تم")) return "delivered";
  if (lower.includes("شحن") || lower.includes("ship")) return "shipped";
  if (lower.includes("تجهيز") || lower.includes("process")) return "processing";
  if (lower.includes("إرجاع") || lower.includes("return") || lower.includes("مرتجع")) return "returned";
  if (lower.includes("ملغي") || lower.includes("cancel")) return "cancelled";
  return "pending";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const dataType = String(formData.get("data_type") || "orders");

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const text = await file.text();
    const rows = parseCSV(text);

    // Log upload
    const { data: uploadRow } = await supabase.from("data_uploads").insert({
      filename: file.name,
      file_type: file.name.endsWith(".csv") ? "csv" : "xlsx",
      rows_total: rows.length,
      data_type: dataType,
      status: "processing",
    }).select().single();
    const uploadId = uploadRow?.id;

    let imported = 0, failed = 0;

    if (dataType === "orders") {
      for (const row of rows) {
        try {
          const orderId = resolveField(row, "رقم الطلب", "order_id", "order_number", "id", "order id");
          const total = parseFloat(resolveField(row, "الإجمالي", "total", "amount", "المبلغ", "قيمة الطلب") || "0");
          const status = mapRowStatus(resolveField(row, "الحالة", "status", "order_status"));
          const source = resolveField(row, "المصدر", "source", "channel", "القناة") || "direct";
          const customerName = resolveField(row, "اسم العميل", "customer_name", "customer", "العميل");
          const customerEmail = resolveField(row, "البريد الإلكتروني", "email", "customer_email");
          const createdAt = resolveField(row, "تاريخ الطلب", "created_at", "date", "التاريخ");

          if (!orderId) { failed++; continue; }

          const { error } = await supabase.from("orders").upsert({
            order_id: `CSV-${orderId}`,
            customer_name: customerName || null,
            customer_email: customerEmail || null,
            total: isNaN(total) ? 0 : total,
            items_count: 1,
            status,
            source: source.toLowerCase(),
            returned: status === "returned",
            created_at: createdAt ? new Date(createdAt).toISOString() : new Date().toISOString(),
          }, { onConflict: "order_id" });

          if (error) { failed++; } else { imported++; }
        } catch { failed++; }
      }

    } else if (dataType === "products") {
      for (const row of rows) {
        try {
          const name = resolveField(row, "اسم المنتج", "name", "product_name", "المنتج");
          const sku = resolveField(row, "sku", "رمز المنتج", "code");
          const stock = parseInt(resolveField(row, "المخزون", "stock", "quantity", "الكمية") || "0");
          const category = resolveField(row, "التصنيف", "category", "الفئة") || "عام";

          if (!name) { failed++; continue; }

          const { error } = await supabase.from("products").upsert({
            name,
            sku: sku || name.slice(0, 20),
            category,
            current_stock: isNaN(stock) ? 0 : stock,
            sold_count: parseInt(resolveField(row, "مبيعات", "sold", "sold_count") || "0"),
            return_count: 0,
            revenue: parseFloat(resolveField(row, "إيرادات", "revenue") || "0"),
            featured: false,
          }, { onConflict: "sku" });

          if (error) { failed++; } else { imported++; }
        } catch { failed++; }
      }
    }

    // Update upload log
    await supabase.from("data_uploads").update({
      rows_imported: imported,
      rows_failed: failed,
      status: failed === rows.length ? "failed" : "success",
      completed_at: new Date().toISOString(),
    }).eq("id", uploadId);

    return new Response(JSON.stringify({ success: true, total: rows.length, imported, failed }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
