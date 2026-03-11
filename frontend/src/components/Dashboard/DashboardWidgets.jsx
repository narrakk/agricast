import React, { memo } from 'react';
import { motion } from 'framer-motion';
import WeatherIcon from '../WeatherIcon';

const cardVariants = {
  hidden:  { opacity: 0, y: 24, scale: 0.96 },
  visible: { opacity: 1, y: 0,  scale: 1 },
};

/**
 * Mini city weather card for comparison.
 */
export const CityCard = memo(({ name, temp, condition, code, delay }) => {
  const condColor = code >= 61 ? 'var(--accent-sky-light)' : 'var(--accent-amber-light)';
  const textColor = code >= 61 ? 'var(--accent-sky)' : 'var(--accent-amber)';

  return (
    <motion.div
      variants={cardVariants}
      transition={{ delay, type: 'spring', stiffness: 280, damping: 22 }}
      whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(60,120,90,0.14)' }}
      className="bg-white/75 backdrop-blur-md border-[1.5px] border-white/90 rounded-[20px] p-3.5 flex items-center gap-3 shadow-sm cursor-default"
    >
      <WeatherIcon code={code ?? 0} size={40} isDay />
      <div className="flex-1">
        <p className="font-display text-[13px] font-bold text-text-primary">{name}</p>
        <p className="text-[11px] text-text-muted mt-0.5">{condition}</p>
      </div>
      <div 
        className="rounded-xl px-2.5 py-1 text-sm font-extrabold font-display min-w-[50px] text-center"
        style={{ backgroundColor: condColor, color: textColor }}
      >
        {temp !== undefined ? `${Math.round(temp)}°` : '—'}
      </div>
    </motion.div>
  );
});

/**
 * Reusable stat pill for weather metrics.
 */
export const StatPill = memo(({ icon, label, value, bg, color }) => {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -3 }}
      className="rounded-[18px] p-3.5 flex flex-col gap-1.5 shadow-sm"
      style={{ backgroundColor: bg }}
    >
      <span className="text-[22px]">{icon}</span>
      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color }}>{label}</p>
      <p className="font-display text-xl font-black text-text-primary leading-none">{value}</p>
    </motion.div>
  );
});

/**
 * Custom tooltip for Recharts.
 */
export const ChartTip = memo(({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1A2E28]/92 backdrop-blur-md rounded-xl p-2 px-3.5 text-xs text-white">
      <p className="font-bold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</strong>
        </p>
      ))}
    </div>
  );
});
