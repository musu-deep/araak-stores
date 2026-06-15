import { ArrowUpRight, TrendingUp } from 'lucide-react';

const shippingCompanies = [
  { name: 'سمسا', logo: 'SM', cost: '10.25', sla: '98.2%', rating: 'A+', orders: 420, color: '#10b981' },
  { name: 'أرامكس', logo: 'AR', cost: '11.40', sla: '96.1%', rating: 'A', orders: 280, color: '#0ea5e9' },
  { name: 'زاجل', logo: 'ZA', cost: '8.75', sla: '94.3%', rating: 'B+', orders: 190, color: '#a78bfa' },
  { name: 'دي إتش إل', logo: 'DH', cost: '15.60', sla: '97.8%', rating: 'A+', orders: 95, color: '#f59e0b' },
  { name: 'نافل', logo: 'NF', cost: '9.30', sla: '93.2%', rating: 'B', orders: 145, color: '#94a3b8' },
];

const trendData = [40, 55, 45, 65, 70, 58, 80, 72, 88, 75, 92, 85, 100, 95, 110, 105, 115, 108, 125, 120];

function MiniArea({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 130, h = 36;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return { x, y };
  });
  const lineStr = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaStr = `${lineStr} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg width={w} height={h} className="opacity-80">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaStr} fill="url(#areaGrad)" />
      <path d={lineStr} fill="none" stroke="#10b981" strokeWidth="1.5" />
      {/* Last point dot */}
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2.5" fill="#10b981" />
    </svg>
  );
}

function RatingBadge({ rating }: { rating: string }) {
  const colors: Record<string, string> = {
    'A+': 'text-green-400 border-green-500/40 bg-green-500/10',
    'A': 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
    'B+': 'text-amber-400 border-amber-500/40 bg-amber-500/10',
    'B': 'text-orange-400 border-orange-500/40 bg-orange-500/10',
  };
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${colors[rating] || ''}`}>
      {rating}
    </span>
  );
}

export default function ShippingPanel() {
  const totalOrders = shippingCompanies.reduce((s, c) => s + c.orders, 0);

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Table */}
      <div className="holo-card flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b border-cyan-500/15">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-cyan-400 blink" />
            <span className="text-cyan-400 text-[10px] font-bold tracking-wider">أداء شركات الشحن</span>
          </div>
          <button className="neon-btn py-0.5 px-2 text-[9px] flex items-center gap-1">
            عرض الكل <ArrowUpRight size={9} />
          </button>
        </div>

        <div className="overflow-auto no-scrollbar flex-1">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-cyan-500/10">
                <th className="text-right text-white/40 font-medium px-3 py-1.5">شركة الشحن</th>
                <th className="text-right text-white/40 font-medium px-2 py-1.5">التكلفة</th>
                <th className="text-right text-white/40 font-medium px-2 py-1.5">معدل النجاح</th>
                <th className="text-right text-white/40 font-medium px-2 py-1.5">SLA</th>
              </tr>
            </thead>
            <tbody>
              {shippingCompanies.map((company, i) => (
                <tr key={i} className="border-b border-cyan-500/5 hover:bg-cyan-500/5 transition-colors cursor-pointer">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded text-white text-[8px] font-bold flex items-center justify-center shrink-0"
                        style={{ background: `${company.color}30`, border: `1px solid ${company.color}50` }}
                      >
                        {company.logo}
                      </div>
                      <div>
                        <p className="text-white font-medium">{company.name}</p>
                        <p className="text-white/30">{company.orders} طلب</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-white/70">{company.cost} ر.س</td>
                  <td className="px-2 py-2">
                    <div className="flex flex-col gap-0.5">
                      <span style={{ color: company.color }} className="font-bold">{company.sla}</span>
                      <div className="progress-bar w-16">
                        <div className="progress-fill" style={{ width: company.sla, background: company.color }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <RatingBadge rating={company.rating} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trend chart */}
      <div className="holo-card px-3 py-2">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={11} className="text-green-400" />
            <span className="text-white/60 text-[9px]">اتجاه تكلفة الشحن</span>
            <span className="text-white/30 text-[9px]">آخر 30 يوم</span>
          </div>
          <span className="text-green-400 text-[10px] font-bold">↑ 234,850 يقياس</span>
        </div>
        <MiniArea data={trendData} />
      </div>
    </div>
  );
}
