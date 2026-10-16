import { useId } from 'react';
import { brl0 } from '../lib/format';
import styles from './charts.module.css';

// Gráficos da landing: SVG puro, sem biblioteca. Cada um recebe `drawn` e
// anima a entrada por CSS (traço desenhado com pathLength=1, barras
// crescendo), então o estado final existe no DOM desde o início -- com
// movimento reduzido, `drawn` já nasce true e nada se mexe.

type Pt = [number, number];

/** Curva suave (Catmull-Rom convertida em Bézier) passando por todos os pontos. */
function smoothPath(points: Pt[]): string {
  if (points.length < 2) return '';
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const t = 0.18;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

function scale(values: readonly number[], w: number, h: number, pad: { t: number; b: number }, min?: number, max?: number): Pt[] {
  const lo = min ?? Math.min(...values);
  const hi = max ?? Math.max(...values);
  const span = hi - lo || 1;
  return values.map((v, i) => [
    (i / (values.length - 1)) * w,
    pad.t + (1 - (v - lo) / span) * (h - pad.t - pad.b),
  ]);
}

// ---------------------------------------------------------------------------
export function AreaChart({
  values,
  labels,
  drawn,
  height = 180,
  className,
}: {
  values: readonly number[];
  labels: readonly string[];
  drawn: boolean;
  height?: number;
  className?: string;
}) {
  const gid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const W = 560;
  const H = height;
  const pts = scale(values, W, H, { t: 16, b: 10 }, Math.min(...values) * 0.82);
  const line = smoothPath(pts);
  const area = `${line} L${W},${H} L0,${H} Z`;
  const lastPt = pts[pts.length - 1];
  return (
    <div className={`${styles.chart} ${className ?? ''}`} data-drawn={drawn}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={`${gid}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#74E8AE" stopOpacity="0.28" />
            <stop offset="1" stopColor="#74E8AE" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1="0" x2={W} y1={H * g} y2={H * g} className={styles.grid} vectorEffect="non-scaling-stroke" />
        ))}
        <path d={area} fill={`url(#${gid}-fill)`} className={styles.area} />
        <path d={line} pathLength={1} className={styles.line} />
      </svg>
      <span
        className={styles.endDot}
        style={{ left: `${(lastPt[0] / W) * 100}%`, top: `${(lastPt[1] / H) * 100}%` }}
        aria-hidden="true"
      />
      <div className={styles.axis} aria-hidden="true">
        {labels.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
export function ColumnChart({
  values,
  labels,
  average,
  highlightLast,
  drawn,
  className,
}: {
  values: readonly number[];
  labels: readonly string[];
  average?: number;
  highlightLast?: boolean;
  drawn: boolean;
  className?: string;
}) {
  const max = Math.max(...values, average ?? 0) * 1.08;
  return (
    <div className={`${styles.columns} ${className ?? ''}`} data-drawn={drawn} aria-hidden="true">
      {average !== undefined && (
        <div className={styles.avg} style={{ bottom: `calc(28px + (100% - 28px) * ${(average / max).toFixed(4)})` }}>
          <span>média</span>
        </div>
      )}
      {values.map((v, i) => {
        const last = highlightLast && i === values.length - 1;
        return (
          <div key={labels[i]} className={styles.col}>
            <div className={styles.colTrack}>
              <div
                className={`${styles.colBar} ${last ? styles.colBarHot : ''}`}
                style={{ height: `${(v / max) * 100}%`, transitionDelay: `${i * 70}ms` }}
              />
            </div>
            <span className={styles.colLabel}>{labels[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
export function ScenarioChart({
  start,
  monthly,
  labels,
  drawn,
  className,
}: {
  start: number;
  monthly: { pessimista: number; realista: number; otimista: number };
  labels: readonly string[];
  drawn: boolean;
  className?: string;
}) {
  const W = 600;
  const H = 220;
  const G = 132; // espaço dos rótulos à direita
  const n = labels.length;
  const series = (['otimista', 'realista', 'pessimista'] as const).map((k) => ({
    key: k,
    values: Array.from({ length: n }, (_, i) => start + monthly[k] * i),
  }));
  const all = series.flatMap((x) => x.values);
  const lo = Math.min(...all) * 0.9;
  const hi = Math.max(...all) * 1.04;
  const pad = { t: 14, b: 8 };
  const toPts = (vals: number[]) => scale(vals, W - G, H, pad, lo, hi);
  return (
    <div className={`${styles.chart} ${className ?? ''}`} data-drawn={drawn}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svgFixed} aria-hidden="true">
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1="0" x2={W - G} y1={H * g} y2={H * g} className={styles.grid} />
        ))}
        {series.map((sr, idx) => {
          const pts = toPts(sr.values);
          const end = pts[pts.length - 1];
          const value = sr.values[sr.values.length - 1];
          return (
            <g key={sr.key} className={styles[`sc_${sr.key}`]}>
              <path
                d={smoothPath(pts)}
                pathLength={1}
                className={styles.scLine}
                style={{ transitionDelay: `${idx * 160}ms` }}
              />
              <circle cx={end[0]} cy={end[1]} r={3.5} className={styles.scDot} style={{ transitionDelay: `${900 + idx * 160}ms` }} />
              <text x={end[0] + 12} y={end[1] - 3} className={styles.scLabel} style={{ transitionDelay: `${1000 + idx * 160}ms` }}>
                <tspan className={styles.scKey}>{sr.key}</tspan>
                <tspan x={end[0] + 12} dy="15" className={styles.scValue}>
                  {brl0(Math.round(value / 10) * 10)}
                </tspan>
              </text>
            </g>
          );
        })}
      </svg>
      <div className={styles.axis} style={{ paddingRight: `${(G / W) * 100}%` }} aria-hidden="true">
        {labels.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
/** Arco de 240 graus com a nota no centro (saúde financeira). */
export function Gauge({ value, drawn, label }: { value: number; drawn: boolean; label: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const arc = c * (240 / 360);
  return (
    <div className={styles.gauge} data-drawn={drawn}>
      <svg viewBox="0 0 140 140" aria-hidden="true">
        <g transform="rotate(150 70 70)">
          <circle cx="70" cy="70" r={r} className={styles.gaugeTrack} strokeDasharray={`${arc} ${c}`} />
          <circle
            cx="70"
            cy="70"
            r={r}
            className={styles.gaugeValue}
            strokeDasharray={`${arc} ${c}`}
            style={{ strokeDashoffset: drawn ? arc * (1 - value / 100) : arc }}
          />
        </g>
      </svg>
      <div className={styles.gaugeCenter}>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

/** Anel de progresso (meta). */
export function Ring({ value, drawn, size = 64 }: { value: number; drawn: boolean; size?: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={styles.ring} aria-hidden="true">
      <circle cx="32" cy="32" r={r} className={styles.gaugeTrack} />
      <circle
        cx="32"
        cy="32"
        r={r}
        className={styles.gaugeValue}
        strokeDasharray={c}
        transform="rotate(-90 32 32)"
        style={{ strokeDashoffset: drawn ? c * (1 - value / 100) : c }}
      />
    </svg>
  );
}
