// Sparkline de KPI. Doze pontos, sem eixo, sem rótulo.
//
// Serve para dar DIREÇÃO, não valor: por isso o traço fica no hue de
// de-ênfase e só o ponto do período corrente recebe a cor de destaque. O
// valor exato é o próprio número grande do KPI, logo acima, e a série
// completa está na tabela do gráfico principal.
export default function Sparkline({
  values,
  width = 96,
  height = 30,
  accent = 'var(--series-1)',
  label,
}) {
  if (!values?.length) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 4;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const pts = values.map((v, i) => ({
    x: pad + (i / (values.length - 1)) * w,
    y: pad + h - ((v - min) / span) * h,
  }));

  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  const end = pts[pts.length - 1];

  return (
    <svg
      className="mn-spark"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role={label ? 'img' : 'presentation'}
      aria-label={label}
      aria-hidden={label ? undefined : 'true'}
      focusable="false"
    >
      <path
        d={d}
        fill="none"
        stroke="var(--series-mute)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* anel na cor da superfície: o ponto continua legível onde cruza o traço */}
      <circle cx={end.x} cy={end.y} r="3" fill={accent} stroke="var(--chart-surface)" strokeWidth="2" />
    </svg>
  );
}
