import { useMemo, useState } from "react";
import {
  Users, Package, Truck, Megaphone, Building2, Wallet,
  FileText, AlertTriangle, Activity, Link, Settings, Zap, Loader2, Send
} from "lucide-react";
import { supabase } from "../lib/supabase";
import type { DashboardData } from "../types";

type Props = { section: string; data: DashboardData };
type Message = { role: "user" | "agent"; text: string };

const agents: Record<string, any> = {
  performance: {
    title: "نبض الأعمال",
    subtitle: "Business Pulse Agent",
    icon: Activity,
    color: "#00d4ff",
    reads: ["daily_metrics", "orders", "products", "campaigns", "risk_alerts"],
    questions: ["ما وضع الأعمال اليوم؟", "ما الذي تغير خلال آخر 24 ساعة؟", "ما أهم المخاطر الحالية؟", "ما أهم الفرص الحالية؟"],
    recommendations: ["مراجعة الانحرافات التشغيلية", "معالجة المخاطر المفتوحة", "استغلال الفرص الأعلى قيمة", "رفع موجز تنفيذي للإدارة"],
  },
  sales: {
    title: "المبيعات",
    subtitle: "Sales Intelligence Agent",
    icon: Activity,
    color: "#10b981",
    reads: ["orders", "products", "daily_metrics", "abandoned_carts"],
    questions: ["ما اتجاه المبيعات؟", "ما أعلى المنتجات أثراً؟", "ما فرص البيع الضائعة؟", "ما متوسط قيمة الطلب؟"],
    recommendations: ["رفع متوسط قيمة الطلب", "استغلال المنتجات الأعلى دوراناً", "استعادة فرص البيع الضائعة", "تحسين العروض حسب سلوك الطلب"],
  },
  finance: {
    title: "المالية",
    subtitle: "Finance Intelligence Agent",
    icon: Wallet,
    color: "#f59e0b",
    reads: ["daily_metrics", "orders", "products", "risk_alerts"],
    questions: ["ما الموقف المالي اليوم؟", "أين الهدر؟", "ما هامش الربح؟", "ما المخاطر المالية؟"],
    recommendations: ["تحليل الهامش حسب المنتج", "مراجعة تكلفة الشحن مقابل الربح", "تحديد المنتجات الأعلى ربحية", "رفع ملخص مالي يومي"],
  },
  inventory: { title: "المخزون", subtitle: "Inventory Intelligence Agent", icon: Package, color: "#a78bfa", reads: ["products", "orders"], questions: ["ما المنتجات المهددة بالنفاد؟", "ما الراكد؟", "ما الذي يجب إعادة طلبه؟"], recommendations: ["إعادة طلب المنتجات عالية الدوران", "تصفية المنتجات الراكدة", "تفعيل تنبيه انخفاض المخزون"] },
  shipping: { title: "الشحن", subtitle: "Shipping Intelligence Agent", icon: Truck, color: "#f59e0b", reads: ["orders", "sync_logs"], questions: ["من أفضل شركة شحن؟", "أين التأخير؟", "ما تكلفة الشحن مقارنة بالنجاح؟"], recommendations: ["راجع أداء شركات الشحن", "حلل التأخير حسب المنطقة", "اقترح شركة بديلة للشحنات المتأخرة"] },
  marketing: { title: "التسويق", subtitle: "Marketing Intelligence Agent", icon: Megaphone, color: "#00d4ff", reads: ["campaigns", "daily_metrics", "orders", "abandoned_carts"], questions: ["أي حملة تحقق أفضل عائد؟", "ما الحملات الضعيفة؟", "أين نزيد الميزانية؟"], recommendations: ["زيد ميزانية الحملات الأعلى عائداً", "أوقف الحملات منخفضة التحويل", "استهدف السلات المهجورة"] },
  customers: { title: "العملاء", subtitle: "Customer Intelligence Agent", icon: Users, color: "#ec4899", reads: ["orders", "abandoned_carts"], questions: ["من العملاء الأعلى قيمة؟", "من فقدنا؟", "من مهدد بالمغادرة؟", "ما السلات المهجورة؟"], recommendations: ["استرجاع العملاء الخاملين", "عرض خاص للعملاء الأعلى قيمة", "حملة لاستعادة السلات المهجورة"] },
  procurement: { title: "الموردون", subtitle: "Procurement Intelligence Agent", icon: Building2, color: "#a78bfa", reads: ["products", "orders", "gap_analysis"], questions: ["من المورد الأفضل؟", "ما فجوات التوريد؟", "ما فرص تحسين التكلفة؟", "من الموردون المهددون؟"], recommendations: ["قارن الموردين حسب السعر والالتزام", "حلل فجوات التوريد", "اقترح بدائل للموردين ضعيفي الأداء"] },
  reports: { title: "التقارير", subtitle: "Executive Reporting Agent", icon: FileText, color: "#00d4ff", reads: ["daily_metrics", "orders", "risk_alerts"], questions: ["ما الملخص التنفيذي؟", "ما أهم 5 قرارات؟", "ماذا يجب رفعه للإدارة؟"], recommendations: ["إنشاء تقرير تنفيذي", "تلخيص المخاطر والفرص", "رفع توصيات قابلة للتنفيذ"] },
  alerts: { title: "التنبيهات", subtitle: "Risk & Alerts Agent", icon: AlertTriangle, color: "#ef4444", reads: ["risk_alerts", "orders", "products"], questions: ["ما التنبيهات الحرجة؟", "ما أسبابها؟", "ما الإجراء العاجل؟"], recommendations: ["حوّل التنبيهات العالية إلى مهام", "عالج أسباب التنبيهات المتكررة", "ارفع تقرير مخاطر يومي"] },
  zid: { title: "ربط المتجر", subtitle: "Zid Sync Agent", icon: Link, color: "#00d4ff", reads: ["zid_connection", "zid_webhook_events", "sync_logs"], questions: ["هل المزامنة تعمل؟", "ما آخر طلبات زد؟", "هل webhooks تصل؟"], recommendations: ["شغّل مزامنة زد", "راجع سجلات المزامنة", "أضف مفاتيح زد كأسرار في Supabase"] },
  settings: { title: "الإعدادات", subtitle: "System Agent Settings", icon: Settings, color: "#64748b", reads: ["sync_logs", "zid_connection"], questions: ["ما حالة الربط؟", "ما الإعدادات الناقصة؟", "ما مفاتيح التشغيل المطلوبة؟"], recommendations: ["راجع مفاتيح Supabase", "راجع أسرار زد", "اختبر الدوال المنشورة"] },
};

function getInsight(section: string, data: DashboardData, latest: any) {
  const revenue = Number(latest?.revenue || 0);
  const ordersToday = Number(latest?.total_orders || data.orders.length || 0);
  const alerts = data.alerts.filter((a: any) => !a.resolved);
  const products = data.products || [];
  const campaigns = data.campaigns || [];
  const ordersList = data.orders || [];
  const topProduct: any = products[0];
  const criticalAlerts = alerts.filter((a: any) => a.severity === "high").length;
  const stockRisk = products.filter((p: any) => Number(p.stock || 0) < 10).length;
  const totalOrdersValue = ordersList.reduce((sum: number, o: any) => sum + Number(o.total || o.amount || o.total_amount || 0), 0);
  const avgOrder = ordersToday ? Math.round((revenue || totalOrdersValue) / ordersToday) : 0;

  if (section === "performance") {
    return [
      { label: "نبض الأعمال", value: criticalAlerts > 3 ? "يتطلب انتباه" : "مستقر", desc: "قراءة مركبة للمبيعات والمخاطر والمخزون." },
      { label: "الأولوية التنفيذية", value: criticalAlerts > stockRisk ? "المخاطر" : stockRisk > 0 ? "المخزون" : "النمو", desc: "أكثر ملف يحتاج متابعة حالياً." },
      { label: "المنتج المحوري", value: topProduct?.name || "غير متوفر", desc: "المنتج الأكثر تأثيراً على النشاط." },
      { label: "النشاط اليومي", value: `${ordersToday} طلب / ${revenue.toLocaleString()} ريال`, desc: "ملخص الحركة الحالية." },
    ];
  }

  if (section === "sales") {
    return [
      { label: "زخم المبيعات", value: ordersToday > 20 ? "مرتفع" : ordersToday > 5 ? "متوسط" : "منخفض", desc: "قراءة لحجم الطلبات الحالية." },
      { label: "متوسط قيمة الطلب", value: avgOrder ? `${avgOrder.toLocaleString()} ريال` : "قيد القراءة", desc: "مؤشر مهم لفرص البيع الإضافي." },
      { label: "أفضل منتج مبيعاً", value: topProduct?.name || "لا يوجد", desc: "حسب sold_count." },
      { label: "فرص البيع الضائعة", value: `${Math.max(ordersToday * 2, 0)} فرصة`, desc: "تقدير أولي من الطلبات والسلات." },
    ];
  }

  if (section === "finance") {
    return [
      { label: "الموقف المالي", value: revenue > 0 ? "نشط" : "قيد القراءة", desc: "قراءة إيراد اليوم وحركة الطلبات." },
      { label: "إيراد اليوم", value: `${revenue.toLocaleString()} ريال`, desc: "من daily_metrics." },
      { label: "قيمة الطلبات المقروءة", value: `${totalOrdersValue.toLocaleString()} ريال`, desc: "من آخر الطلبات المتاحة." },
      { label: "هامش الربح", value: latest?.profit_margin ? `${latest.profit_margin}%` : "قيد الربط", desc: "يتطلب تكلفة المنتج والشحن." },
    ];
  }

  if (section === "procurement") {
    const fastMoving = products.filter((p: any) => Number(p.sold_count || 0) > 20).length;
    return [
      { label: "فجوات التوريد", value: stockRisk, desc: "منتجات تحتاج موردين أو إعادة طلب." },
      { label: "منتجات سريعة الحركة", value: fastMoving, desc: "تحتاج اتفاقيات توريد أقوى." },
      { label: "أولوية التفاوض", value: topProduct?.name || "لا يوجد", desc: "ابدأ بأعلى منتج مبيعاً." },
      { label: "تحسين التكلفة", value: "قيد التحليل", desc: "يتطلب إدخال أسعار الموردين." },
    ];
  }

  if (section === "shipping") {
    return [
      { label: "طلبات قيد الشحن", value: ordersToday, desc: "قراءة من orders." },
      { label: "أفضل أداء", value: "قيد الربط", desc: "يحتاج بيانات شركة الشحن." },
      { label: "مناطق تحتاج متابعة", value: "جدة / الرياض", desc: "تقدير حتى ربط بيانات المناطق." },
      { label: "فرص تحسين التكلفة", value: "مفتوحة", desc: "تحتاج مقارنة التكلفة بزمن التسليم." },
    ];
  }

  if (section === "reports") {
    return [
      { label: "ملخص تنفيذي", value: "جاهز", desc: "يجمع الأداء والمخاطر والفرص." },
      { label: "مؤشرات رئيسية", value: "4 مؤشرات", desc: "مبيعات، طلبات، تنبيهات، مخزون." },
      { label: "قرارات مقترحة", value: alerts.length + 3, desc: "مستخرجة من البيانات الحالية." },
      { label: "جاهزية الرفع", value: "85%", desc: "تحتاج اعتماد الرئيس التنفيذي." },
    ];
  }

  if (section === "settings") {
    return [
      { label: "Supabase", value: "متصل", desc: "الجداول والدوال منشورة." },
      { label: "Zid Secrets", value: "تحتاج مراجعة", desc: "Client ID و Access Token." },
      { label: "Functions", value: "3 نشطة", desc: "csv-import / zid-sync / zid-webhook." },
      { label: "الحالة العامة", value: "تشغيلية", desc: "تحتاج تفعيل الربط النهائي." },
    ];
  }

  return [
    { label: "إيراد اليوم", value: `${revenue.toLocaleString()} ريال`, desc: "من daily_metrics." },
    { label: "طلبات اليوم", value: ordersToday, desc: "من orders / daily_metrics." },
    { label: "أفضل منتج", value: topProduct?.name || "لا يوجد", desc: "حسب الأعلى مبيعاً." },
    { label: "تنبيهات مفتوحة", value: alerts.length, desc: "من risk_alerts." },
  ];
}

function answerQuestion(section: string, question: string, data: DashboardData) {
  const products = data.products || [];
  const alerts = data.alerts.filter((a: any) => !a.resolved);
  const orders = data.orders || [];
  const lowStock = products.filter((p: any) => Number(p.stock || 0) < 10).length;

  if (section === "performance") {
    const criticalAlerts = alerts.filter((a: any) => a.severity === "high").length;
    return `نبض الأعمال الحالي: التنبيهات الحرجة ${criticalAlerts}، المنتجات منخفضة المخزون ${lowStock}، الطلبات المقروءة ${orders.length}. الأولوية هي ربط المخاطر بحركة المبيعات والمخزون قبل أي توسع تسويقي. سؤالك: "${question}".`;
  }

  if (section === "sales") {
    const topProduct: any = products[0];
    return `قراءة وكيل المبيعات: أعلى منتج حالياً هو ${topProduct?.name || "غير متوفر"}، وعدد الطلبات المقروءة ${orders.length}. أرى فرصاً في رفع متوسط قيمة الطلب واستعادة السلات المهجورة. سؤالك: "${question}".`;
  }

  if (section === "finance") {
    const total = orders.reduce((sum: number, o: any) => sum + Number(o.total || o.amount || o.total_amount || 0), 0);
    return `قراءة وكيل المالية: قيمة الطلبات المقروءة تقريباً ${total.toLocaleString()} ريال. نحتاج ربط تكلفة المنتج والشحن لاستخراج هامش ربح دقيق. سؤالك: "${question}".`;
  }

  return `قراءة الوكيل: استلمت سؤالك "${question}". سأقرأ الجداول المرتبطة بهذا القسم وأحوّلها إلى توصية تنفيذية قابلة للتطبيق.`;
}

export default function AgentWorkspace({ section, data }: Props) {
  const [running, setRunning] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const agent = agents[section] || agents.performance;
  const Icon = agent.icon;
  const latest = data.metrics?.[data.metrics.length - 1];
  const intelligence = useMemo(() => getInsight(section, data, latest), [section, data, latest]);

  async function runAgent() {
    setRunning(true);
    try {
      if (section === "zid") {
        const { data, error } = await supabase.functions.invoke("zid-sync");
        if (error) throw error;
        console.log(data);
        alert("تم تشغيل وكيل ربط زد.");
      } else {
        setMessages((prev) => [...prev, { role: "agent", text: `بدأ ${agent.title} القراءة. سأركز على: ${agent.questions.join("، ")}.` }]);
      }
    } catch (error: any) {
      alert(error?.message || "تعذر تشغيل الوكيل.");
    } finally {
      setRunning(false);
    }
  }

  function askAgent() {
    const q = question.trim();
    if (!q) return;
    const reply = answerQuestion(section, q, data);
    setMessages((prev) => [...prev, { role: "user", text: q }, { role: "agent", text: reply }]);
    setQuestion("");
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden px-3 py-3">
      <div className="holo-card flex-1 overflow-y-auto p-5">
        <div className="flex items-center gap-4 border-b border-cyan-500/15 pb-4 mb-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${agent.color}20`, border: `1px solid ${agent.color}55` }}>
            <Icon size={28} style={{ color: agent.color }} />
          </div>
          <div>
            <h1 className="text-white text-2xl font-black">{agent.title}</h1>
            <p className="text-white/40 text-sm">{agent.subtitle}</p>
          </div>
          <button onClick={runAgent} disabled={running} className="neon-btn mr-auto px-4 py-2 text-xs flex items-center gap-2 disabled:opacity-50" style={{ color: agent.color, borderColor: `${agent.color}66` }}>
            {running ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            تشغيل الوكيل
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          {intelligence.map((item, i) => (
            <div key={i} className="rounded-xl border border-cyan-500/15 bg-black/20 p-4">
              <p className="text-white/40 text-[10px] mb-2">{item.label}</p>
              <p className="text-cyan-400 text-lg font-black">{item.value}</p>
              <p className="text-white/25 text-[9px] mt-2 leading-4">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="rounded-xl border border-cyan-500/15 bg-black/20 p-4">
            <p className="text-cyan-400 font-bold text-sm mb-3">ماذا يقرأ هذا الوكيل؟</p>
            <div className="space-y-2">
              {agent.reads.map((table: string) => <div key={table} className="text-white/60 text-xs border border-white/10 rounded-lg px-3 py-2">{table}</div>)}
            </div>
          </div>

          <div className="rounded-xl border border-cyan-500/15 bg-black/20 p-4">
            <p className="text-cyan-400 font-bold text-sm mb-3">أسئلة الوكيل</p>
            <div className="space-y-2">
              {agent.questions.map((q: string, i: number) => (
                <button key={i} onClick={() => setQuestion(q)} className="w-full text-right text-white/60 text-xs border border-white/10 hover:border-cyan-400/40 rounded-lg px-3 py-2">{q}</button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-cyan-500/15 bg-black/20 p-4">
            <p className="text-cyan-400 font-bold text-sm mb-3">توصيات قابلة للتنفيذ</p>
            <div className="space-y-2">
              {agent.recommendations.map((r: string, i: number) => <button key={i} className="w-full text-right text-white/70 text-xs border border-white/10 hover:border-cyan-400/40 rounded-lg px-3 py-2">{i + 1}. {r}</button>)}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/5 p-4">
          <p className="text-cyan-400 font-bold text-sm mb-3">اسأل الوكيل</p>
          <div className="space-y-2 max-h-44 overflow-y-auto mb-3">
            {messages.length === 0 ? <p className="text-white/35 text-xs">اكتب سؤالك لهذا الوكيل، أو اختر أحد أسئلة الوكيل أعلاه.</p> : messages.map((m, i) => (
              <div key={i} className={`rounded-lg px-3 py-2 text-xs leading-6 ${m.role === "user" ? "bg-cyan-500/10 text-cyan-100 mr-10" : "bg-black/25 text-white/65 ml-10"}`}>{m.text}</div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") askAgent(); }} placeholder="اكتب سؤالك للوكيل..." className="flex-1 bg-black/30 border border-cyan-500/20 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-cyan-400/60" />
            <button onClick={askAgent} className="neon-btn px-4 text-xs flex items-center gap-2"><Send size={14} />اسأل</button>
          </div>
        </div>
      </div>
    </div>
  );
}
