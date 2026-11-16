"use client";
import { useMemo, useState } from 'react';

const DAY = 86400000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Dependency-free SVG line chart; click a point to jump to that date. */
export default function TrendChart({ points, allDates, current, unit, digits = 1, onPick, color = '#16a34a', emptyText }) {
  const [hover, setHover] = useState(null);
  const W = 640, H = 190, M = { l: 40, r: 12, t: 12, b: 24 };

  const m = useMemo(() => {
    const t0 = new Date(allDates[0] + 'T00:00:00Z').getTime();
    const t1 = new Date(allDates[allDates.length - 1] + 'T00:00:00Z').getTime();
    const pts = points.filter((p) => Number.isFinite(p.v)).map((p) => ({ ...p, t: new Date(p.date + 'T00:00:00Z').getTime() }));
    let lo = Math.min(...pts.map((p) => p.v)), hi = Math.max(...pts.map((p) => p.v));
    if (!pts.length) { lo = 0; hi = 1; }
    if (unit === '%') { lo = Math.min(lo, 0); hi = Math.max(hi, 10); }
    const pad = (hi - lo) * 0.08 || 1;
    lo = unit === '%' ? Math.max(0, lo) : lo - pad;
    hi = unit === '%' ? Math.min(100, hi + pad) : hi + pad;
    const x = (t) => M.l + ((t - t0) / Math.max(1, t1 - t0)) * (W - M.l - M.r);
    const y = (v) => H - M.b - ((v - lo) / (hi - lo || 1)) * (H - M.t - M.b);
    // month ticks
    const ticks = [];
    const d = new Date(t0); d.setUTCDate(1); d.setUTCHours(0, 0, 0, 0); d.setUTCMonth(d.getUTCMonth() + 1);
    while (d.getTime() < t1) { ticks.push({ t: d.getTime(), label: MONTHS[d.getUTCMonth()] + (d.getUTCMonth() === 0 ? ` ${d.getUTCFullYear()}` : '') }); d.setUTCMonth(d.getUTCMonth() + 1); }
    return { pts, lo, hi, x, y, ticks, t0, t1 };
  }, [points, allDates, unit]);

  if (!m.pts.length) {
    return <div className="flex h-[190px] items-center justify-center text-sm text-gray-500 dark:text-gray-400">{emptyText}</div>;
  }
  const path = m.pts.map((p, i) => `${i ? 'L' : 'M'}${m.x(p.t).toFixed(1)},${m.y(p.v).toFixed(1)}`).join(' ');
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => m.lo + (m.hi - m.lo) * f);
  const fmt = (v) => v.toFixed(digits) + (unit === '%' ? '%' : '');
  const curT = current ? new Date(current + 'T00:00:00Z').getTime() : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full select-none" role="img" aria-label="trend over time">
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={M.l} x2={W - M.r} y1={m.y(v)} y2={m.y(v)} className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="1" />
            <text x={M.l - 6} y={m.y(v) + 3} textAnchor="end" className="fill-gray-500 dark:fill-gray-400" fontSize="10">{fmt(v)}</text>
          </g>
        ))}
        {m.ticks.map((t, i) => (
          <text key={i} x={m.x(t.t)} y={H - 6} textAnchor="middle" className="fill-gray-500 dark:fill-gray-400" fontSize="10">{t.label}</text>
        ))}
        {curT != null && curT >= m.t0 && curT <= m.t1 && (
          <line x1={m.x(curT)} x2={m.x(curT)} y1={M.t} y2={H - M.b} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3" />
        )}
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        {m.pts.map((p) => (
          <g key={p.date} onClick={() => onPick(p.date)} onMouseEnter={() => setHover(p)} onMouseLeave={() => setHover(null)} className="cursor-pointer">
            <circle cx={m.x(p.t)} cy={m.y(p.v)} r="9" fill="transparent" />
            <circle cx={m.x(p.t)} cy={m.y(p.v)} r={p.date === current ? 5 : 3.2} fill={p.date === current ? '#f59e0b' : color} stroke="white" strokeWidth="1" />
          </g>
        ))}
      </svg>
      {hover && (
        <div className="pointer-events-none absolute right-2 top-1 rounded bg-gray-900/90 px-2 py-1 text-xs text-white">
          {hover.date}: <b>{fmt(hover.v)}</b>
        </div>
      )}
    </div>
  );
}
