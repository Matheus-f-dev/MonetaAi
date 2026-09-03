import { useRef, useState } from 'react';
import { brlAxis, brl } from '../lib/format';
import {
  useSize, scale, domainFor, linePath, areaPath, nearestIndex, tickStride,
} from './chartUtils';
import DataTable from './DataTable';

// Série única de saldo ao longo do tempo. Uma série, um eixo, uma cor: não há
// legenda porque não há o que distinguir, o título já diz o que está plotado.
//
// Camada de interação: mira vertical + tooltip no hover e no foco de teclado.
// O valor exato também vive na tabela, então o tooltip melhora a leitura sem
// ser o único caminho até o número.
export default function AreaChart({
  data,
  height = 208,
  label = 'Saldo consolidado',
  tableView = 'visible',
  strokeVar = 'var(--series-1)',
  id = 'saldo',
}) {
  const [wrapRef, width] = useSize();
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);

  const values = data.map((d) => d.value);
  const { lo, hi, ticks } = domainFor(values);

  const pad = { top: 14, right: 14, bottom: 24, left: 52 };
  const plotW = Math.max(60, width - pad.left - pad.right);
  const plotH = Math.max(60, height - pad.top - pad.bottom);

  const points = data.map((d, i) => ({
    x: pad.left + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW),
    y: pad.top + plotH - (scale(d.value, [lo, hi], [0, plotH])),
    ...d,
  }));

  const xs = points.map((p) => p.x);
  const baseY = pad.top + plotH;
  const stride = tickStride(data.length, plotW);
  const active = hover === null ? null : points[hover];
  const clipId = `mn-clip-${id}`;

  const onMove = (event) => {
    if (!svgRef.current) return;
    setHover(nearestIndex(event.clientX, svgRef.current, xs));
  };

  const onKeyDown = (event) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    setHover((prev) => {
      const next = (prev === null ? (step > 0 ? 0 : data.length - 1) : prev + step);
      return Math.min(data.length - 1, Math.max(0, next));
    });
  };

  return (
    <figure className="mn-chart" ref={wrapRef}>
      <svg
        ref={svgRef}
        className="mn-chart__svg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${label}. Série de ${data.length} pontos, de ${brl(values[0])} a ${brl(values[values.length - 1])}.`}
        tabIndex={0}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        onFocus={() => setHover(data.length - 1)}
        onBlur={() => setHover(null)}
        onKeyDown={onKeyDown}
      >
        <defs>
          <linearGradient id={`${clipId}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeVar} stopOpacity="0.16" />
            <stop offset="100%" stopColor={strokeVar} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* grade: hairline sólida, um passo fora da superfície, recessiva */}
        {ticks.map((t) => {
          const y = pad.top + plotH - scale(t, [lo, hi], [0, plotH]);
          return (
            <g key={t}>
              <line
                x1={pad.left} x2={pad.left + plotW} y1={y} y2={y}
                stroke="var(--grid)" strokeWidth="1" shapeRendering="crispEdges"
              />
              <text
                x={pad.left - 10} y={y + 3.5}
                textAnchor="end" className="mn-chart__tick"
              >
                {brlAxis(t)}
              </text>
            </g>
          );
        })}

        <path d={areaPath(points, baseY)} fill={`url(#${clipId}-fill)`} />
        <path
          d={linePath(points)}
          fill="none"
          stroke={strokeVar}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* eixo x */}
        <line
          x1={pad.left} x2={pad.left + plotW} y1={baseY} y2={baseY}
          stroke="var(--axis)" strokeWidth="1" shapeRendering="crispEdges"
        />
        {points.map((p, i) => (
          (i % stride === 0 || i === points.length - 1) ? (
            <text key={p.label} x={p.x} y={baseY + 16} textAnchor="middle" className="mn-chart__tick">
              {p.label}
            </text>
          ) : null
        ))}

        {/* ponta da série: marcador com anel na cor da superfície */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="4.5"
          fill={strokeVar}
          stroke="var(--chart-surface)"
          strokeWidth="2"
        />

        {/* mira + ponto ativo */}
        {active ? (
          <g>
            <line
              x1={active.x} x2={active.x} y1={pad.top} y2={baseY}
              stroke="var(--axis)" strokeWidth="1"
            />
            <circle
              cx={active.x} cy={active.y} r="4.5"
              fill={strokeVar} stroke="var(--chart-surface)" strokeWidth="2"
            />
          </g>
        ) : null}
      </svg>

      {active ? (
        <div
          className="mn-chart__tip"
          style={{
            left: `${Math.min(Math.max(active.x, 62), width - 62)}px`,
            top: `${Math.max(active.y - 12, 4)}px`,
          }}
          aria-hidden="true"
        >
          <span className="mn-mono mn-chart__tip-k">{active.label}</span>
          <span className="mn-chart__tip-v">{brl(active.value)}</span>
        </div>
      ) : null}

      {tableView !== 'none' ? (
        <DataTable
          hidden={tableView === 'hidden'}
          caption={label}
          head={['Mês', label]}
          rows={data.map((d) => [d.label, brl(d.value)])}
        />
      ) : null}
    </figure>
  );
}
