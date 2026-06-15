import { useState } from 'react';
import {
  BarChart2, TrendingUp, Tag, Package, Users, Zap, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const actions = [
  { label: 'تحليل شامل', sub: 'AI Analysis', action: 'analysis', icon: BarChart2, color: '#00d4ff' },
  { label: 'تنبؤ المبيعات', sub: 'Forecasting', action: 'forecast', icon: TrendingUp, color: '#10b981' },
  { label: 'تحسين الأسعار', sub: 'Pricing AI', action: 'pricing', icon: Tag, color: '#a78bfa' },
  { label: 'إدارة المخزون', sub: 'Inventory AI', action: 'inventory', icon: Package, color: '#f59e0b' },
  { label: 'تحليل العملاء', sub: 'Customer AI', action: 'customers', icon: Users, color: '#ec4899' },
  { label: 'مزامنة زد', sub: 'Zid Sync', action: 'zid-sync', icon: Zap, color: '#00d4ff' },
];

export default function QuickActions() {
  const [running, setRunning] = useState<string | null>(null);

  async function handleAction(action: string) {
    setRunning(action);

    try {
      if (action === 'zid-sync') {
        const { data, error } = await supabase.functions.invoke('zid-sync');

        if (error) {
          console.error('Zid sync error:', error);
          alert(`فشلت مزامنة زد: ${error.message}`);
          return;
        }

        console.log('Zid sync result:', data);
        alert('تم تشغيل مزامنة زد بنجاح');
        return;
      }

      const messages: Record<string, string> = {
        analysis: 'سيتم فتح ملخص التحليل التنفيذي.',
        forecast: 'سيتم فتح وحدة توقع المبيعات.',
        pricing: 'سيتم فتح وكيل تحسين الأسعار.',
        inventory: 'سيتم فتح وكيل إدارة المخزون.',
        customers: 'سيتم فتح وحدة تحليل العملاء.',
      };

      alert(messages[action] || 'تم تنفيذ الإجراء');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تنفيذ الإجراء');
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="grid grid-cols-6 gap-2 shrink-0 px-0">
      {actions.map((action, i) => {
        const Icon = action.icon;
        const isRunning = running === action.action;

        return (
          <button
            key={i}
            onClick={() => handleAction(action.action)}
            disabled={!!running}
            className="holo-card px-2 py-2.5 flex flex-col items-center gap-1.5 hover:bg-white/5 transition-all cursor-pointer group disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ '--hover-color': action.color } as React.CSSProperties}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all group-hover:scale-110"
              style={{ background: `${action.color}15`, border: `1px solid ${action.color}30` }}
            >
              {isRunning ? (
                <Loader2 size={16} className="animate-spin" style={{ color: action.color }} />
              ) : (
                <Icon size={16} style={{ color: action.color }} />
              )}
            </div>

            <div className="text-center">
              <p className="text-white text-[10px] font-semibold leading-none">{action.label}</p>
              <p className="text-white/30 text-[8px] mt-0.5">
                {isRunning ? 'جارٍ التنفيذ...' : action.sub}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}