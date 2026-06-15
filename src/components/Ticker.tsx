const tickerItems = [
  { type: 'news', text: 'آخر الأخبار – تحليل المتنافسين – الربع الثاني 2025' },
  { type: 'alert', text: 'منذ 5 ساعات – تقرير أداء الحملات التسويقية لشهر مايو' },
  { type: 'update', text: 'منذ 6 ساعات – تحديث خوارزمية التتبؤ بالمبيعات' },
  { type: 'news', text: 'منذ 6 ساعات – تقرير أداء الحملات التسويقية' },
  { type: 'alert', text: 'منذ 5 ساعات – تحليل الشبكة الأسبوعي متاح الآن' },
  { type: 'update', text: 'تحديث مباشر – حملة رمضان 2025 تحقق أعلى إيرادات بتاريخ المتجر: 2.4M ريال' },
  { type: 'alert', text: 'تنبيه – ارتفاع معدل الإرجاع في منطقة الشرقية 8% عن الأسبوع الماضي' },
  { type: 'news', text: 'جديد – إطلاق خط منتجات العناية الطبيعية خلال أسبوعين' },
];

export default function Ticker() {
  const doubled = [...tickerItems, ...tickerItems];

  const typeColors: Record<string, string> = {
    news: '#00d4ff',
    alert: '#ef4444',
    update: '#10b981',
  };
  const typeLabels: Record<string, string> = {
    news: '● خبر',
    alert: '⚠ تنبيه',
    update: '✓ تحديث',
  };

  return (
    <div className="h-8 bg-[#020c1f] border-t border-cyan-500/15 flex items-center overflow-hidden shrink-0 relative">
      {/* Static label */}
      <div className="px-3 shrink-0 border-l border-cyan-500/20 h-full flex items-center bg-cyan-500/10">
        <span className="text-cyan-400 text-[9px] font-bold tracking-widest uppercase whitespace-nowrap">
          آخر الأخبار
        </span>
      </div>

      {/* Scrolling ticker */}
      <div className="flex-1 overflow-hidden">
        <div className="ticker-inner">
          {doubled.map((item, i) => (
            <div key={i} className="flex items-center gap-4 px-6 shrink-0">
              <span
                className="text-[9px] font-bold whitespace-nowrap"
                style={{ color: typeColors[item.type] }}
              >
                {typeLabels[item.type]}
              </span>
              <span className="text-white/50 text-[10px] whitespace-nowrap">{item.text}</span>
              <span className="text-cyan-500/30 text-[9px]">›</span>
            </div>
          ))}
        </div>
      </div>

      {/* Gradient fade edges */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#020c1f] to-transparent pointer-events-none" />
    </div>
  );
}
