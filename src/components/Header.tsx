import { useState, useEffect } from 'react';
import { Bell, Mail, Settings, Search, Globe, Clock } from 'lucide-react';

interface HeaderProps {
  alertCount: number;
}

export default function Header({ alertCount }: HeaderProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');
  const timeStr = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())} ${time.getHours() >= 12 ? 'PM' : 'AM'}`;
  const dateStr = time.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-cyan-500/15 bg-[#020c1f] shrink-0 z-50">
      {/* Left: search */}
      <div className="flex items-center gap-3 flex-1">
        <div className="relative">
          <Search size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cyan-500/50" />
          <input
            type="text"
            placeholder="البحث الذكي..."
            className="bg-white/5 border border-cyan-500/20 rounded-md pr-7 pl-3 py-1 text-xs text-white/70 placeholder-white/30 outline-none focus:border-cyan-500/50 w-48"
          />
        </div>
      </div>

      {/* Center: date/time */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 text-cyan-400/70">
          <Clock size={11} />
          <span className="font-mono text-cyan-300 text-glow-cyan font-bold">{timeStr}</span>
        </div>
        <div className="flex items-center gap-1.5 text-cyan-400/70">
          <Globe size={11} />
          <span>GMT+3</span>
        </div>
        <div className="text-white/50">{dateStr}</div>
      </div>

      {/* Right: actions + profile */}
      <div className="flex items-center gap-3 flex-1 justify-start">
        {/* Notifications */}
        <button className="relative p-1.5 rounded-md border border-cyan-500/20 bg-cyan-500/5 hover:border-cyan-500/40 transition-all">
          <Bell size={14} className="text-cyan-400" />
          {alertCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold glow-red blink">
              {alertCount}
            </span>
          )}
        </button>

        <button className="relative p-1.5 rounded-md border border-cyan-500/20 bg-cyan-500/5 hover:border-cyan-500/40 transition-all">
          <Mail size={14} className="text-cyan-400" />
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-cyan-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
            5
          </span>
        </button>

        <button className="p-1.5 rounded-md border border-cyan-500/20 bg-cyan-500/5 hover:border-cyan-500/40 transition-all">
          <Settings size={14} className="text-cyan-400/70" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-cyan-500/20" />

        {/* Profile */}
        <div className="flex items-center gap-2">
          <div className="text-left">
            <p className="text-white/70 text-[10px] leading-none">الرئيس التنفيذي</p>
            <p className="text-white text-xs font-bold leading-none mt-0.5">Chief of Commerce</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold glow-cyan">
            CEO
          </div>
        </div>
      </div>
    </header>
  );
}
