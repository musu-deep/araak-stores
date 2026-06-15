import { ArrowUpRight } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { Product, Campaign } from '../types';

interface RightPanelProps {
  products: Product[];
  campaigns: Campaign[];
}

const channelData = [
  { name: 'المتجر الإلكتروني', value: 48, color: '#00d4ff' },
  { name: 'بيك توك', value: 22, color: '#a78bfa' },
  { name: 'إنستغرام', value: 15, color: '#ec4899' },
  { name: 'سناب شات', value: 8, color: '#f59e0b' },
  { name: 'أخرى', value: 7, color: '#64748b' },
];

const geoData = [
  { city: 'الرياض', pct: 32, color: '#00d4ff' },
  { city: 'جدة', pct: 24, color: '#10b981' },
  { city: 'الدمام', pct: 16, color: '#a78bfa' },
  { city: 'مكة', pct: 12, color: '#f59e0b' },
  { city: 'المدينة', pct: 8, color: '#ec4899' },
  { city: 'أخرى', pct: 8, color: '#475569' },
];

function SectionHeader({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-cyan-500/15 shrink-0">
      <div className="flex items-center gap-1.5">
        <div className="w-1 h-1 rounded-full bg-cyan-400 blink" />
        <span className="text-cyan-400 text-[10px] font-bold tracking-wider">{label}</span>
        {sub && <span className="text-white/30 text-[9px]">{sub}</span>}
      </div>
      <button className="neon-btn py-0.5 px-2 text-[9px] flex items-center gap-1">
        عرض التفاصيل <ArrowUpRight size={9} />
      </button>
    </div>
  );
}

export default function RightPanel({ products, campaigns }: RightPanelProps) {
  const totalChannelRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
  const topProducts = products.slice(0, 3);

  return (
    <aside className="w-52 shrink-0 flex flex-col gap-2 overflow-y-auto no-scrollbar pr-1">

      {/* Channel Performance */}
      <div className="holo-card overflow-hidden">
        <SectionHeader label="الأداء حسب القناة" sub="آخر 30 يوم" />
        <div className="px-3 py-2">
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie
                data={channelData}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={52}
                dataKey="value"
                strokeWidth={0}
              >
                {channelData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => `${v}%`}
                contentStyle={{ background: '#0a1628', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 6, color: '#fff', fontSize: 10 }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="text-center -mt-10 mb-2">
            <p className="text-cyan-400 text-[16px] font-black text-glow-cyan">
              {(totalChannelRevenue / 1000000).toFixed(1)}M
            </p>
            <p className="text-white/40 text-[9px]">إجمالي المبيعات</p>
          </div>

          <div className="space-y-1.5 mt-2">
            {channelData.map((ch, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="font-bold text-[10px]" style={{ color: ch.color }}>{ch.value}%</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: ch.color }} />
                  <span className="text-white/60 text-[9px]">{ch.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="holo-card overflow-hidden">
        <SectionHeader label="أفضل المنتجات" sub="حسب المبيعات" />
        <div className="px-3 py-2 space-y-2">
          {(topProducts.length > 0 ? topProducts : [
            { id: '1', name: 'ساعة ذكية XS', sku: 'SKU001', category: '', current_stock: 0, sold_count: 2450, return_count: 0, revenue: 125430, featured: true },
            { id: '2', name: 'سماعات يو', sku: 'SKU002', category: '', current_stock: 0, sold_count: 1980, return_count: 0, revenue: 98750, featured: false },
            { id: '3', name: 'شاحن سريع 65W', sku: 'SKU003', category: '', current_stock: 0, sold_count: 3250, return_count: 0, revenue: 76540, featured: false },
          ]).slice(0, 3).map((product, i) => {
            const maxSold = 3500;
            const pct = Math.min((product.sold_count / maxSold) * 100, 100);
            return (
              <div key={product.id} className="flex items-start gap-2">
                <span className="text-[11px] font-black text-white/30 w-3 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-[10px] text-white font-medium truncate">{product.name}</p>
                    <p className="text-[9px] text-white/40 shrink-0">{product.sold_count.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="progress-bar flex-1 ml-2">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${pct}%`,
                          background: i === 0 ? 'linear-gradient(90deg, #00d4ff, #0ea5e9)' : i === 1 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #a78bfa, #7c3aed)',
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-white/30 shrink-0">{product.revenue.toLocaleString()} ر.س</span>
                  </div>
                </div>
              </div>
            );
          })}
          <button className="w-full neon-btn text-[9px] mt-1">عرض جميع المنتجات</button>
        </div>
      </div>

      {/* Geographic Distribution */}
      <div className="holo-card overflow-hidden flex-1">
        <SectionHeader label="توزيع المبيعات الجغرافي" sub="آخر 30 يوم" />
        <div className="px-3 py-2 space-y-2">
          {/* Saudi map placeholder */}
          <div
            className="w-full h-24 rounded-md flex items-center justify-center relative overflow-hidden"
            style={{ background: 'rgba(0, 30, 60, 0.5)', border: '1px solid rgba(0,212,255,0.15)' }}
          >
            <svg viewBox="0 0 200 130" className="w-full h-full opacity-60">
              {/* Simplified Saudi Arabia outline */}
              <path
                d="M 60 20 L 80 15 L 110 10 L 140 15 L 160 25 L 175 40 L 180 60 L 170 80 L 155 95 L 140 105 L 120 110 L 100 115 L 80 108 L 65 95 L 55 80 L 45 65 L 40 45 Z"
                fill="rgba(0, 212, 255, 0.08)"
                stroke="rgba(0, 212, 255, 0.4)"
                strokeWidth="1.5"
              />
              {/* City dots */}
              <circle cx="110" cy="60" r="4" fill="#00d4ff" opacity="0.9" />
              <circle cx="80" cy="70" r="3" fill="#10b981" opacity="0.8" />
              <circle cx="140" cy="70" r="2.5" fill="#a78bfa" opacity="0.8" />
              <circle cx="75" cy="55" r="2" fill="#f59e0b" opacity="0.7" />
              <circle cx="100" cy="80" r="1.5" fill="#ec4899" opacity="0.7" />
              {/* Labels */}
              <text x="115" y="58" fill="rgba(0,212,255,0.8)" fontSize="7">الرياض</text>
              <text x="56" y="72" fill="rgba(16,185,129,0.8)" fontSize="7">جدة</text>
              <text x="143" y="68" fill="rgba(167,139,250,0.8)" fontSize="7">الدمام</text>
            </svg>
            <button className="absolute bottom-1 left-1 neon-btn text-[8px] py-0.5 px-1.5">عرض الخريطة الكاملة</button>
          </div>

          {/* City list */}
          <div className="space-y-1.5">
            {geoData.map((city, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="font-bold text-[10px]" style={{ color: city.color }}>{city.pct}%</span>
                <div className="flex items-center gap-1.5 flex-1 mx-2">
                  <div className="progress-bar flex-1">
                    <div className="progress-fill" style={{ width: `${city.pct}%`, background: city.color }} />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: city.color }} />
                  <span className="text-white/60 text-[9px]">{city.city}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
