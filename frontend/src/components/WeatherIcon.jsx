import React from 'react';

// ─── Rain drops (animated) ────────────────────────────────────────────────────
function RainDrops({ count = 5, color = '#48B8E8' }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: 'inherit' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rain-drop" style={{
          left: `${10 + i * 18}%`,
          height: `${10 + Math.random() * 8}px`,
          background: `linear-gradient(180deg, transparent, ${color})`,
          animationDuration: `${0.6 + i * 0.15}s`,
          animationDelay: `${i * 0.12}s`,
          opacity: 0.7
        }} />
      ))}
    </div>
  );
}

// ─── Sun rays (animated) ─────────────────────────────────────────────────────
function SunRays({ size = 80 }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Glow ring */}
      <div className="sun-ray" style={{
        position: 'absolute', inset: -8,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,166,35,0.25) 0%, transparent 70%)',
      }} />
      {/* Outer ray ring */}
      <div className="sun-ray" style={{
        position: 'absolute', inset: -4,
        borderRadius: '50%',
        border: '2px dashed rgba(245,166,35,0.3)',
        animation: 'spin-slow 20s linear infinite',
      }} />
      {/* Sun circle */}
      <div style={{
        width: size * 0.6,
        height: size * 0.6,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, #FFE566, #F5A623)',
        boxShadow: '0 4px 20px rgba(245,166,35,0.4)',
        position: 'relative',
        zIndex: 1
      }} />
    </div>
  );
}

// ─── Cloud (SVG, animated) ────────────────────────────────────────────────────
function CloudShape({ color = 'white', opacity = 1, scale = 1 }) {
  return (
    <svg width={70 * scale} height={44 * scale} viewBox="0 0 70 44" fill="none">
      <path d="M58 36H16C9.373 36 4 30.627 4 24C4 17.373 9.373 12 16 12C16.34 12 16.677 12.012 17.01 12.036C18.822 7.99 22.844 5.2 27.5 5.2C32.048 5.2 36 7.9 37.85 11.8C39.077 10.82 40.634 10.2 42.33 10.2C46.224 10.2 49.384 13.25 49.617 17.1C49.745 17.034 49.874 16.97 50 16.9C50.628 16.632 51.297 16.484 52 16.484C55.297 16.484 58 19.187 58 22.484V36Z"
        fill={color} opacity={opacity}
        filter="url(#cloudShadow)"
      />
      <defs>
        <filter id="cloudShadow">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="rgba(60,120,90,0.12)" />
        </filter>
      </defs>
    </svg>
  );
}

// ─── Main WeatherIcon component ───────────────────────────────────────────────
/**
 * @param {number} code   - WMO weather code
 * @param {number} size   - Width/height in px
 * @param {boolean} isDay - Day or night
 */
export default function WeatherIcon({ code, size = 64, isDay = true }) {
  const s = size;

  // ── Clear / mostly clear ──────────────────────────────────────────────────
  if (code <= 1) {
    if (!isDay) {
      return (
        <div style={{ width: s, height: s, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="float">
          <div style={{
            fontSize: s * 0.75,
            filter: 'drop-shadow(0 4px 12px rgba(100,120,200,0.3))',
            userSelect: 'none'
          }}>🌙</div>
        </div>
      );
    }
    return (
      <div style={{ width: s, height: s, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="float">
        <SunRays size={s} />
      </div>
    );
  }

  // ── Partly cloudy ─────────────────────────────────────────────────────────
  if (code === 2) {
    return (
      <div style={{ width: s, height: s, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isDay && (
          <div style={{ position: 'absolute', top: 0, right: 4 }} className="float-2">
            <SunRays size={s * 0.55} />
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 4, left: 0 }} className="float">
          <CloudShape color="white" scale={s / 70} />
        </div>
      </div>
    );
  }

  // ── Overcast ──────────────────────────────────────────────────────────────
  if (code === 3) {
    return (
      <div style={{ width: s, height: s, position: 'relative' }} className="float-slow">
        <CloudShape color="#E8EFF0" scale={s / 70} opacity={0.9} />
        <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
          <CloudShape color="#D8E5E8" scale={s * 0.75 / 70} opacity={0.7} />
        </div>
      </div>
    );
  }

  // ── Rain ──────────────────────────────────────────────────────────────────
  if (code >= 51 && code <= 82) {
    const isHeavy = code >= 65 || code >= 80;
    return (
      <div style={{ width: s, height: s, position: 'relative' }} className="float">
        <div className="float-slow">
          <CloudShape color={isHeavy ? '#B0C8D8' : '#C8DCE8'} scale={s / 70} />
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: '10%', width: '80%', height: s * 0.4, overflow: 'hidden' }}>
          <RainDrops count={isHeavy ? 7 : 4} />
        </div>
      </div>
    );
  }

  // ── Thunderstorm ─────────────────────────────────────────────────────────
  if (code >= 95) {
    return (
      <div style={{ width: s, height: s, position: 'relative' }} className="float">
        <CloudShape color="#8899AA" scale={s / 70} />
        <div style={{
          position: 'absolute', bottom: 0, left: '40%',
          fontSize: s * 0.4, lineHeight: 1,
          filter: 'drop-shadow(0 2px 8px rgba(255,200,50,0.6))',
          animation: 'sunRay 1.5s ease-in-out infinite'
        }}>⚡</div>
      </div>
    );
  }

  // ── Fallback ──────────────────────────────────────────────────────────────
  return (
    <div style={{ width: s, height: s, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: s * 0.7 }} className="float">
      🌤️
    </div>
  );
}
