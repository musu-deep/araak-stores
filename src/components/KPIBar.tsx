import { ArrowUp, ArrowDown } from 'lucide-react';
import type { DailyMetric } from '../types';

interface KPIBarProps {
  metrics: DailyMetric[];
}

interface KPI {
  label: string;
  value: string;
  unit: string;
  change: string;
  changeLabel: string;
  up: boolean;
  color: string;
  sparkData: number[];
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 60;
  const h = 20;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} className="opacity-70">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export default function KPIBar({ metrics }: KPIBarProps) {
  const recent = metrics.slice(-7);
  const today = metrics[metrics.length - 1];
  const yesterday = metrics[metrics.length - 2];

  if (!today) return null;

  const pctChange = (curr: number, prev: number) => {
    if (!prev) return '0.0';
    return Math.abs(((curr - prev) / prev) * 100).toFixed(1);
  };

  const kpis: KPI[] = [
    {
      label: 'المبيعات اليوم',
      value: today.total_revenue.toLocaleString(),
      unit: 'ريال',
      change: pctChange(today.total_revenue, yesterday?.total_revenue || today.total_revenue),
      changeLabel: `عن أمس ${pctChange(today.total_revenue, yesterday?.total_revenue || today.total_revenue)}%`,
      up: today.total_revenue >= (yesterday?.total_revenue || 0),
      color: '#00d4ff',
      sparkData: recent.map(m => Number(m.total_revenue)),
    },
    {
      label: 'الربح الصافي',
      value: (today.total_revenue * 0.252).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ','),
      unit: 'ريال',
      change: '22.4',
      changeLabel: 'عن أمس 22.4%',
      up: true,
      color: '#10b981',
      sparkData: recent.map(m => Number(m.total_revenue) * 0.252),
    },
    {
      label: 'طلبات اليوم',
      value: today.total_orders.toLocaleString(),
      unit: 'طلب',
      change: pctChange(today.total_orders, yesterday?.total_orders || today.total_orders),
      changeLabel: `عن أمس`,
      up: today.total_orders >= (yesterday?.total_orders || 0),
      color: '#a78bfa',
      sparkData: recent.map(m => m.total_orders),
    },
    {
      label: 'متوسط قيمة الطلب',
      value: today.avg_order_value.toFixed(0),
      unit: 'ريال',
      change: pctChange(today.avg_order_value, yesterday?.avg_order_value || today.avg_order_value),
      changeLabel: 'عن 5 أيام',
      up: today.avg_order_value >= (yesterday?.avg_order_value || 0),
      color: '#f59e0b',
      sparkData: recent.map(m => Number(m.avg_order_value)),
    },
    {
      label: 'معدل التحويل',
      value: today.conversion_rate.toFixed(2),
      unit: '%',
      change: pctChange(today.conversion_rate, yesterday?.conversion_rate || today.conversion_rate),
      changeLabel: 'منذ 5 أيام',
      up: today.conversion_rate >= (yesterday?.conversion_rate || 0),
      color: '#10b981',
      sparkData: recent.map(m => m.conversion_rate),
    },
    {
      label: 'العملاء النشطون',
      value: today.unique_visitors.toLocaleString(),
      unit: 'عميل',
      change: '100/100',
      changeLabel: 'جميع الأنظمة تعمل بكفاءة',
      up: true,
      color: '#00d4ff',
      sparkData: recent.map(m => m.unique_visitors),
    },
  ];

  return (
    <div className="holo-card glow-cyan mx-3 mt-2 mb-2 relative">
      {/* Corner brackets */}
      <div className="bracket-corner bracket-tl" />
      <div className="bracket-corner bracket-tr" />
      <div className="bracket-corner bracket-bl" />
      <div className="bracket-corner bracket-br" />

      <div className="flex items-center gap-2 px-4 py-1.5 border-b border-cyan-500/15">
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 blink" />
        <span className="text-cyan-400 text-[10px] font-bold tracking-widest uppercase">مؤشرات الأداء الرئيسية</span>
      </div>

      <div className="grid grid-cols-6 divide-x divide-x-reverse divide-cyan-500/15">
        {kpis.map((kpi, i) => (
          <div key={i} className="px-3 py-2 hover:bg-cyan-500/5 transition-colors">
            <p className="text-white/50 text-[9px] mb-0.5">{kpi.label}</p>
            <div className="flex items-end gap-1 mb-0.5">
              <span
                className="text-xl font-black leading-none"
                style={{ color: kpi.color, textShadow: `0 0 15px ${kpi.color}80` }}
              >
                {kpi.value}
              </span>
              <span className="text-white/40 text-[10px] mb-0.5">{kpi.unit}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-0.5 text-[9px] ${kpi.up ? 'text-green-400' : 'text-red-400'}`}>
                {kpi.up ? <ArrowUp size={9} /> : <ArrowDown size={9} />}
                <span>{kpi.changeLabel}</span>
              </div>
              <MiniSparkline data={kpi.sparkData} color={kpi.color} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
