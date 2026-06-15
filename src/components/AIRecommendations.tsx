import { ArrowUpRight, ChevronLeft } from 'lucide-react';
import type { RiskAlert } from '../types';

interface AIRecommendationsProps {
  alerts: RiskAlert[];
}

const staticRecs = [
  {
    severity: 'high',
    title: 'ارتفاع في تكلفة الشحن مع شركة أرامكس',
    detail: 'ارتفعت التكلفة 19% – تحقق 7 أيام',
    time: 'منذ 3 دقائق',
  },
  {
    severity: 'medium',
    title: 'منتج ذكية 5G – ساعات المحركة',
    detail: '441 مليون يبيع منذ',
    time: 'منذ 14 دقيقة',
  },
  {
    severity: 'high',
    title: 'نفاد مخزون وشيك',
    detail: 'كابل شحن سريع – التكلفة المتبقية 12 وحدة',
    time: 'منذ 22 دقيقة',
  },
  {
    severity: 'medium',
    title: 'انخفاض معدل التحويل',
    detail: 'منطقة الرياض – انخفاض 7%',
    time: 'منذ 35 دقيقة',
  },
];

function SeverityBar({ severity }: { severity: string }) {
  if (severity === 'high') return (
    <div className="w-1 self-stretch rounded-full bg-red-500 glow-red shrink-0" />
  );
  return (
    <div className="w-1 self-stretch rounded-full bg-amber-500 shrink-0" />
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  if (severity === 'high') {
    return <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 blink">عالٍ</span>;
  }
  return <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">متوسط</span>;
}

export default function AIRecommendations({ alerts }: AIRecommendationsProps) {
  const items = alerts.length > 0 ? alerts.map(a => ({
    severity: a.severity,
    title: a.title,
    detail: a.description,
    time: new Date(a.triggered_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
  })) : staticRecs;

  return (
    <div className="holo-card flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-cyan-500/15 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-1 h-1 rounded-full bg-amber-400 blink" />
          <span className="text-amber-400 text-[10px] font-bold tracking-wider">التنبيهات الذكية</span>
        </div>
        <button className="neon-btn py-0.5 px-2 text-[9px] border-amber-500/30 text-amber-400 flex items-center gap-1">
          عرض الكل <ArrowUpRight size={9} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-cyan-500/10">
        {items.slice(0, 6).map((item, i) => (
          <div
            key={i}
            className="flex gap-2.5 px-3 py-2.5 hover:bg-white/5 transition-colors cursor-pointer group"
          >
            <SeverityBar severity={item.severity} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <SeverityBadge severity={item.severity} />
                <p className="text-white/30 text-[9px]">{item.time}</p>
              </div>
              <p className="text-white text-[11px] font-medium leading-tight truncate">{item.title}</p>
              <p className="text-white/40 text-[9px] mt-0.5 leading-tight">{item.detail}</p>
            </div>
            <ChevronLeft size={12} className="text-white/20 group-hover:text-cyan-400 transition-colors shrink-0 mt-1" />
          </div>
        ))}
      </div>

      {/* Cash flow mini */}
      <div className="border-t border-cyan-500/15 px-3 py-2 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-purple-400" />
            <span className="text-white/40 text-[9px]">التدفق النقدي</span>
            <span className="text-white/20 text-[9px]">آخر 30 يوم</span>
          </div>
        </div>
        <div className="flex items-end gap-0.5 h-8">
          {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 72, 88, 78, 100].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: `${h}%`,
                background: h > 70 ? 'rgba(124, 58, 237, 0.7)' : 'rgba(124, 58, 237, 0.3)',
              }}
            />
          ))}
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-purple-400 text-[10px] font-bold">2,450,000 ريال</span>
          <span className="text-white/30 text-[9px]">↑ 8%</span>
        </div>
      </div>
    </div>
  );
}
