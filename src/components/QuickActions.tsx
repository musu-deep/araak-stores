import {
  BarChart2, TrendingUp, Tag, Package, Users, Zap
} from 'lucide-react';

const actions = [
  { label: 'تحليل شامل', sub: 'AI Analysis', icon: BarChart2, color: '#00d4ff' },
  { label: 'تتبؤ المبيعات', sub: 'Forecasting', icon: TrendingUp, color: '#10b981' },
  { label: 'تحسين الأسعار', sub: 'Pricing AI', icon: Tag, color: '#a78bfa' },
  { label: 'إدارة المخزون', sub: 'Inventory AI', icon: Package, color: '#f59e0b' },
  { label: 'تحليل العملاء', sub: 'Customer AI', icon: Users, color: '#ec4899' },
  { label: 'توصيات ذكية', sub: 'Smart Actions', icon: Zap, color: '#00d4ff' },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-6 gap-2 shrink-0 px-0">
      {actions.map((action, i) => {
        const Icon = action.icon;
        return (
          <button
            key={i}
            className="holo-card px-2 py-2.5 flex flex-col items-center gap-1.5 hover:bg-white/5 transition-all cursor-pointer group"
            style={{ '--hover-color': action.color } as React.CSSProperties}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all group-hover:scale-110"
              style={{ background: `${action.color}15`, border: `1px solid ${action.color}30` }}
            >
              <Icon size={16} style={{ color: action.color }} />
            </div>
            <div className="text-center">
              <p className="text-white text-[10px] font-semibold leading-none">{action.label}</p>
              <p className="text-white/30 text-[8px] mt-0.5">{action.sub}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
