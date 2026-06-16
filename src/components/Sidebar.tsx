import {
  LayoutGrid, Activity, ShoppingBag, Package, Truck,
  Megaphone, Users, Building2, Wallet, FileText,
  Bell, Settings, Store, Link2,
} from 'lucide-react';

interface SidebarProps {
  active: string;
  onNavigate: (section: string) => void;
  systemUptime: string;
}

const navItems = [
  { id: 'command', label: 'اللوحة الرئيسية', sub: 'Command Deck', icon: LayoutGrid },
  { id: 'performance', label: 'لوحة الأداء', sub: 'Performance', icon: Activity },
  { id: 'sales', label: 'المبيعات', sub: 'Sales Intel', icon: ShoppingBag },
  { id: 'inventory', label: 'المخزون', sub: 'Inventory', icon: Package },
  { id: 'shipping', label: 'الشحن', sub: 'Shipping', icon: Truck },
  { id: 'marketing', label: 'التسويق', sub: 'Marketing', icon: Megaphone },
  { id: 'customers', label: 'العملاء', sub: 'Customers', icon: Users },
  { id: 'suppliers', label: 'الموردون', sub: 'Procurement', icon: Building2 },
  { id: 'finance', label: 'المالية', sub: 'Finance', icon: Wallet },
  { id: 'reports', label: 'التقارير', sub: 'Reports', icon: FileText },
  { id: 'alerts', label: 'التنبيهات', sub: 'Alerts', icon: Bell },
  { id: 'datasources', label: 'ربط المتجر', sub: 'Zid · CSV · API', icon: Link2 },
  { id: 'settings', label: 'الإعدادات', sub: 'Settings', icon: Settings },
];

export default function Sidebar({ active, onNavigate, systemUptime }: SidebarProps) {
  return (
    <aside className="flex flex-col w-40 shrink-0 border-l border-cyan-500/15 bg-[#020c1f] relative">
      {/* Logo */}
      <div className="flex flex-col items-center gap-1 py-4 border-b border-cyan-500/15 px-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center glow-cyan shrink-0">
          <Store size={20} className="text-white" />
        </div>
        <div className="text-center">
          <p className="text-cyan-400 text-xs font-black tracking-widest leading-none">ARAAK</p>
          <p className="text-cyan-300/70 text-[9px] tracking-wider leading-none mt-0.5">STORES</p>
          <p className="text-cyan-500/50 text-[8px] tracking-widest leading-none mt-0.5">AI COMMAND CENTER</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto no-scrollbar py-2 px-2 space-y-0.5">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`sidebar-item w-full text-right ${active === item.id ? 'active' : ''}`}
            >
              <Icon size={14} className="shrink-0" />
              <div className="text-right min-w-0">
                <p className="text-xs font-medium leading-none">{item.label}</p>
                <p className="text-[9px] opacity-50 leading-none mt-0.5">{item.sub}</p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* System status */}
      <div className="border-t border-cyan-500/15 px-3 py-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] text-cyan-500/70">النظام يعمل بكفاءة</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="status-active" />
          <span className="text-green-400 text-[11px] font-bold">{systemUptime}%</span>
        </div>
        <div className="progress-bar mt-1.5">
          <div className="progress-fill" style={{ width: `${systemUptime}%`, background: 'linear-gradient(90deg, #10b981, #059669)' }} />
        </div>
      </div>
    </aside>
  );
}
