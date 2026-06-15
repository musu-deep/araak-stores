import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import type { DashboardData } from './types';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import KPIBar from './components/KPIBar';
import Globe from './components/Globe';
import ShippingPanel from './components/ShippingPanel';
import AIRecommendations from './components/AIRecommendations';
import RightPanel from './components/RightPanel';
import AgentsDock from './components/AgentsDock';
import QuickActions from './components/QuickActions';
import Ticker from './components/Ticker';
import DataSources from './components/DataSources';

export default function App() {
  const [activeSection, setActiveSection] = useState('command');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    metrics: [],
    products: [],
    campaigns: [],
    alerts: [],
    orders: [],
    team: [],
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    const [metricsRes, productsRes, campaignsRes, alertsRes, ordersRes, teamRes] = await Promise.all([
      supabase.from('daily_metrics').select('*').order('date', { ascending: true }).limit(30),
      supabase.from('products').select('*').order('sold_count', { ascending: false }),
      supabase.from('campaigns').select('*'),
      supabase.from('risk_alerts').select('*').order('triggered_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(20),
      supabase.from('team_members').select('*').order('performance_score', { ascending: false }),
    ]);

    setData({
      metrics: metricsRes.data || [],
      products: productsRes.data || [],
      campaigns: campaignsRes.data || [],
      alerts: alertsRes.data || [],
      orders: ordersRes.data || [],
      team: teamRes.data || [],
    });
    setLoading(false);
  }

  const activeAlerts = data.alerts.filter(a => !a.resolved);

  return (
    <div className="h-screen flex flex-col overflow-hidden grid-lines" style={{ background: 'var(--navy)' }}>
      {/* Scan line effect */}
      <div className="scanline" />

      {/* Header */}
      <Header alertCount={activeAlerts.length} />

      {/* Main layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          active={activeSection}
          onNavigate={setActiveSection}
          systemUptime="99.98"
        />

        {/* Main content area */}
        <div className="flex-1 flex min-w-0 overflow-hidden">
          {activeSection === 'datasources' ? (
            <DataSources />
          ) : (
            <>
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden px-2 py-2 gap-2">
                {loading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full border-2 border-t-cyan-400 border-cyan-500/20 animate-spin" />
                      <p className="text-cyan-400/60 text-xs tracking-widest">جارٍ تحميل البيانات...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* KPI Bar */}
                    <KPIBar metrics={data.metrics} />

                    {/* Middle row: Shipping | Globe | AI Recommendations */}
                    <div className="flex gap-2 flex-1 min-h-0 overflow-hidden">
                      {/* Left panel: Shipping */}
                      <div className="w-56 shrink-0 flex flex-col min-h-0">
                        <ShippingPanel />
                      </div>

                      {/* Center: Globe */}
                      <div className="flex-1 holo-card flex flex-col overflow-hidden relative glow-cyan">
                        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-cyan-500/15 shrink-0">
                          <div className="w-1 h-1 rounded-full bg-cyan-400 blink" />
                          <span className="text-cyan-400 text-[9px] font-bold tracking-widest uppercase">مركز العمليات العالمي</span>
                          <div className="mr-auto flex items-center gap-1">
                            <span className="text-white/30 text-[9px]">araakstores.com</span>
                          </div>
                        </div>
                        <Globe />
                        <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-4 px-4">
                          {[
                            { label: 'دول التوصيل', value: '3' },
                            { label: 'مناطق نشطة', value: '13' },
                            { label: 'طلبات لحظية', value: `${data.metrics[data.metrics.length - 1]?.total_orders || 0}` },
                          ].map((stat, i) => (
                            <div key={i} className="text-center px-3 py-1.5 rounded-lg" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,212,255,0.2)' }}>
                              <p className="text-cyan-400 text-sm font-black text-glow-cyan">{stat.value}</p>
                              <p className="text-white/40 text-[8px]">{stat.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right panel: AI Recommendations */}
                      <div className="w-56 shrink-0 flex flex-col min-h-0">
                        <AIRecommendations alerts={data.alerts} />
                      </div>
                    </div>

                    {/* Quick actions row */}
                    <QuickActions />

                    {/* Agents dock */}
                    <AgentsDock />
                  </>
                )}
              </div>

              {/* Right panel (channels, products, geo) */}
              <div className="w-52 shrink-0 flex flex-col gap-2 overflow-y-auto no-scrollbar py-2 pl-2 border-r border-cyan-500/10">
                <RightPanel products={data.products} campaigns={data.campaigns} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Ticker */}
      <Ticker />
    </div>
  );
}
