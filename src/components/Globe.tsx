export default function Globe() {
  const dataPoints = [
    { x: 50, y: 30 }, { x: 65, y: 45 }, { x: 35, y: 55 }, { x: 70, y: 60 },
    { x: 45, y: 70 }, { x: 60, y: 35 }, { x: 30, y: 40 }, { x: 75, y: 50 },
    { x: 55, y: 65 }, { x: 40, y: 25 }, { x: 68, y: 72 }, { x: 25, y: 60 },
  ];

  return (
    <div className="flex-1 relative flex items-center justify-center overflow-hidden min-h-0">
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-gradient-radial from-cyan-900/20 via-transparent to-transparent" />

      {/* Globe container */}
      <div className="globe-float relative" style={{ width: 220, height: 220 }}>
        {/* Outer glow ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, transparent 40%, rgba(0, 212, 255, 0.08) 70%, transparent 100%)',
            boxShadow: '0 0 60px 20px rgba(0, 212, 255, 0.15)',
          }}
        />

        {/* Globe base – solid sphere gradient */}
        <div
          className="absolute inset-2 rounded-full"
          style={{
            background: 'radial-gradient(circle at 35% 35%, rgba(0, 100, 180, 0.6), rgba(0, 30, 80, 0.9) 60%, rgba(0, 5, 30, 0.95))',
            boxShadow: 'inset 0 0 40px rgba(0, 212, 255, 0.1), 0 0 40px rgba(0, 212, 255, 0.3)',
          }}
        />

        {/* Grid SVG overlay */}
        <svg className="absolute inset-0 w-full h-full globe-outer" viewBox="0 0 220 220" style={{ opacity: 0.35 }}>
          <defs>
            <clipPath id="globeClip">
              <circle cx="110" cy="110" r="106" />
            </clipPath>
          </defs>
          <g clipPath="url(#globeClip)">
            {/* Latitude lines */}
            {[30, 50, 70, 90, 110, 130, 150, 170, 190].map((y, i) => (
              <ellipse key={i} cx="110" cy={y} rx={Math.sqrt(Math.max(0, 106 * 106 - (y - 110) * (y - 110)))} ry="6"
                fill="none" stroke="rgba(0,212,255,0.4)" strokeWidth="0.5" />
            ))}
            {/* Longitude lines */}
            {[0, 30, 60, 90, 120, 150].map((angle, i) => (
              <ellipse key={i} cx="110" cy="110" rx={Math.abs(Math.cos((angle * Math.PI) / 180)) * 106} ry="106"
                fill="none" stroke="rgba(0,212,255,0.4)" strokeWidth="0.5"
                transform={`rotate(${angle}, 110, 110)`} />
            ))}
          </g>
          {/* Equator highlight */}
          <ellipse cx="110" cy="110" rx="106" ry="8" fill="none" stroke="rgba(0,212,255,0.6)" strokeWidth="1"
            clipPath="url(#globeClip)" />
        </svg>

        {/* Rotating ring 1 */}
        <div
          className="globe-outer absolute"
          style={{
            inset: -16,
            borderRadius: '50%',
            border: '1px solid rgba(0, 212, 255, 0.3)',
            borderTopColor: 'rgba(0, 212, 255, 0.8)',
            boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)',
          }}
        />

        {/* Rotating ring 2 – tilted */}
        <div
          className="globe-mid absolute"
          style={{
            inset: -10,
            borderRadius: '50%',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            borderRightColor: 'rgba(0, 212, 255, 0.6)',
            transform: 'rotateX(70deg)',
          }}
        />

        {/* Data points on globe */}
        {dataPoints.map((pt, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              left: `${pt.x}%`,
              top: `${pt.y}%`,
              background: '#00d4ff',
              boxShadow: '0 0 6px #00d4ff',
              animation: `blink ${1.5 + i * 0.3}s ease-in-out infinite`,
            }}
          />
        ))}

        {/* Glare */}
        <div
          className="absolute rounded-full"
          style={{
            top: '8%',
            right: '18%',
            width: '30%',
            height: '25%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.12), transparent)',
          }}
        />
      </div>

      {/* Orbit particles */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * 360;
        const r = 125;
        const x = 110 + r * Math.cos((angle * Math.PI) / 180);
        const y = 110 + r * Math.sin((angle * Math.PI) / 180);
        return (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-cyan-400"
            style={{
              left: `calc(50% + ${(x - 110) * 0.8}px)`,
              top: `calc(50% + ${(y - 110) * 0.8}px)`,
              opacity: 0.4 + (i % 3) * 0.2,
              boxShadow: '0 0 4px rgba(0,212,255,0.8)',
            }}
          />
        );
      })}

      {/* Center label */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-cyan-500/60 text-[9px] tracking-widest uppercase">araakstores.com</p>
      </div>

      {/* Connection lines to data points */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.3 }}>
        {dataPoints.slice(0, 5).map((pt, i) => (
          <line
            key={i}
            x1="50%" y1="50%"
            x2={`${pt.x}%`} y2={`${pt.y}%`}
            stroke="rgba(0, 212, 255, 0.5)"
            strokeWidth="0.5"
            strokeDasharray="3 3"
          />
        ))}
      </svg>
    </div>
  );
}
