import { useState } from 'react';
import { BarChart2, TrendingUp, Package, Truck, Tag, Megaphone, Users, Building2, Wallet, AlertTriangle, Star, Zap } from 'lucide-react';

const agents = [
  { id: '01', name: 'CEO Agent', label: 'الرئيس التنفيذي', icon: Zap, color: '#00d4ff', status: 'active' },
  { id: '02', name: 'Revenue Agent', label: 'وكيل الإيرادات', icon: TrendingUp, color: '#10b981', status: 'active' },
  { id: '03', name: 'Inventory Agent', label: 'وكيل المخزون', icon: Package, color: '#a78bfa', status: 'active' },
  { id: '04', name: 'Shipping Agent', label: 'وكيل الشحن', icon: Truck, color: '#f59e0b', status: 'active' },
  { id: '05', name: 'Pricing Agent', label: 'وكيل التسعير', icon: Tag, color: '#ec4899', status: 'active' },
  { id: '06', name: 'Marketing Agent', label: 'وكيل التسويق', icon: Megaphone, color: '#00d4ff', status: 'active' },
  { id: '07', name: 'Customer Agent', label: 'وكيل العملاء', icon: Users, color: '#10b981', status: 'active' },
  { id: '08', name: 'Procurement Agent', label: 'وكيل المشتريات', icon: Building2, color: '#a78bfa', status: 'active' },
  { id: '09', name: 'Finance Agent', label: 'وكيل المالية', icon: Wallet, color: '#f59e0b', status: 'active' },
  { id: '10', name: 'Risk Agent', label: 'وكيل المخاطر', icon: AlertTriangle, color: '#ef4444', status: 'active' },
  { id: '11', name: 'Quality Agent', label: 'وكيل الجودة', icon: Star, color: '#00d4ff', status: 'active' },
  { id: '12', name: 'Innovation Agent', label: 'وكيل الابتكار', icon: BarChart2, color: '#10b981', status: 'active' },
];

interface AgentModalProps {
  agent: typeof agents[0];
  onClose: () => void;
}

function AgentModal({ agent, onClose }: AgentModalProps) {
  const Icon = agent.icon;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="holo-card p-5 w-80" style={{ borderColor: `${agent.color}50` }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${agent.color}20`, border: `1px solid ${agent.color}50` }}>
            <Icon size={24} style={{ color: agent.color }} />
          </div>
          <div>
            <p className="text-white font-bold">{agent.name}</p>
            <p style={{ color: agent.color }} className="text-xs">{agent.label}</p>
          </div>
          <span className="mr-auto">
            <span className="status-active" />
          </span>
        </div>
        <div className="space-y-2 text-xs text-white/60">
          <p>الحالة: <span className="text-green-400 font-bold">نشط</span></p>
          <p>آخر تحديث: <span className="text-white/80">منذ دقيقتين</span></p>
          <p>المهام المكتملة: <span className="text-white/80">142 مهمة اليوم</span></p>
          <p>دقة الذكاء الاصطناعي: <span style={{ color: agent.color }} className="font-bold">97.3%</span></p>
        </div>
        <button className="neon-btn w-full mt-4 text-xs" style={{ borderColor: `${agent.color}50`, color: agent.color }}>
          فتح وحدة التحكم الكاملة
        </button>
      </div>
    </div>
  );
}

export default function AgentsDock() {
  const [selectedAgent, setSelectedAgent] = useState<typeof agents[0] | null>(null);

  return (
    <>
      <div className="holo-card shrink-0">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-cyan-500/15">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-cyan-400 blink" />
              <span className="text-cyan-400 text-[10px] font-bold tracking-wider">هيئة الوكلاء التنفيذيين</span>
              <span className="text-white/30 text-[9px]">AI Executive Agents Dock</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/30 text-[9px]">{agents.filter(a => a.status === 'active').length}/{agents.length} نشط</span>
            <button className="neon-btn text-[9px] py-0.5 px-2 flex items-center gap-1">
              عرض الوكلاء والتفاصيل
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-1.5 p-2">
          {agents.map((agent) => {
            const Icon = agent.icon;
            return (
              <button
                key={agent.id}
                className="agent-card"
                onClick={() => setSelectedAgent(agent)}
              >
                {/* Agent avatar */}
                <div
                  className="w-10 h-10 rounded-lg mx-auto mb-1.5 flex items-center justify-center relative"
                  style={{ background: `linear-gradient(135deg, ${agent.color}30, ${agent.color}15)`, border: `1px solid ${agent.color}40` }}
                >
                  <Icon size={18} style={{ color: agent.color }} />
                  {/* Glow pulse */}
                  <div
                    className="absolute inset-0 rounded-lg"
                    style={{ boxShadow: `0 0 10px ${agent.color}30`, animation: `blink ${1.5 + Math.random()}s ease-in-out infinite` }}
                  />
                </div>

                {/* Agent number */}
                <div className="text-center">
                  <p className="text-white/30 text-[8px] font-mono">{agent.id}</p>
                  <p className="text-white text-[9px] font-bold leading-tight">{agent.name}</p>
                  <p style={{ color: agent.color }} className="text-[8px] leading-tight opacity-80">{agent.label}</p>
                </div>

                {/* Status */}
                <div className="flex items-center justify-center gap-1 mt-1">
                  <span className="status-active" style={{ background: agent.status === 'active' ? '#10b981' : '#ef4444' }} />
                  <span className="text-[8px] text-white/40">نشط</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedAgent && (
        <AgentModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
      )}
    </>
  );
}
