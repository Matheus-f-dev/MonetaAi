import { useState } from 'react';
import { brl, brlAxis, pct } from '../lib/format';
import { useSize, domainFor, scale } from './chartUtils';
import DataTable from './DataTable';
import Icon from '../ui/Icon';

// Despesas por categoria. Categorias nominais, então UMA cor para todas as
// barras: colorir cada barra de um tom diferente gastaria o canal de
// identidade para re-codificar o que o comprimento da barra já mostra.
//
// A cor é o cobre porque nesta página cobre é a cor de "sai dinheiro", em todo
// gráfico onde ela aparece. A barra que passou do orçamento não muda de cor:
// ela ganha um marcador de estado com ícone e rótulo, do jeito que estado deve
// ser sinalizado.
export default function CategoryBars({ data, tableView = 'visible' }) {
  const [wrapRef, width] = useSize();
  const [hover, setHover] = useState(null);

  const values = data.map((d) => d.value);
  const { lo, hi, ticks } = domainFor(values, { zeroBase: true, padTop: 0.1 });

  const rowH = 38;
  const barH = 14;              // fino de propósito, longe do limite de 24px
  const pad = { top: 22, right: 16, bottom: 0, left: 0 };
  const labelW = Math.min(176, Math.max(110, width * 0.34));
  const plotW = Math.max(60, width - labelW - pad.right);
  const height = pad.top + data.length * rowH;

  const x = (v) => scale(v, [lo, hi], [0, plotW]);

  return (
    <figure className="mn-chart" ref={wrapRef}>
      <svg
        className="mn-chart__svg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Despesas por categoria. ${data.length} categorias, de ${brl(Math.min(...values))} a ${brl(Math.max(...values))}.`}
      >
        {/* grade vertical + ticks no topo */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={labelW + x(t)} x2={labelW + x(t)}
              y1={pad.top - 6} y2={height}
              stroke="var(--grid)" strokeWidth="1" shapeRendering="crispEdges"
            />
            <text x={labelW + x(t)} y={pad.top - 12} textAnchor="middle" className="mn-chart__tick">
              {brlAxis(t)}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const y = pad.top + i * rowH + (rowH - barH) / 2;
          const w = Math.max(2, x(d.value));
          const over = d.budget != null && d.value > d.budget;
          const budgetX = d.budget != null ? labelW + x(d.budget) : null;
          const isHover = hover === i;

          return (
            <g
              key={d.label}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {/* faixa de acerto larga: o alvo é a linha inteira, não a barra */}
              <rect
                x="0" y={pad.top + i * rowH} width={width} height={rowH}
                fill={isHover ? 'var(--surface-2)' : 'transparent'}
              />

              <text x="0" y={pad.top + i * rowH + rowH / 2 + 4} className="mn-chart__cat">
                {d.label}
              </text>

              {/* a barra: ponta arredondada no dado, reta na base */}
              <path
                d={`M${labelW} ${y} H${labelW + w - 4} a4 4 0 0 1 4 4 v${barH - 8} a4 4 0 0 1 -4 4 H${labelW} Z`}
                fill="var(--series-2)"
              />

              {/* marca do orçamento definido pelo usuário */}
              {budgetX !== null ? (
                <line
                  x1={budgetX} x2={budgetX}
                  y1={y - 4} y2={y + barH + 4}
                  stroke="var(--ink-3)" strokeWidth="1.5" strokeLinecap="round"
                />
              ) : null}

              {over ? (
                <text
                  x={labelW + w + 10}
                  y={pad.top + i * rowH + rowH / 2 + 4}
                  className="mn-chart__over"
                >
                  acima do orçamento
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      {hover !== null ? (
        <div className="mn-chart__legendbox" aria-hidden="true">
          <span className="mn-chart__lb-k">{data[hover].label}</span>
          <span className="mn-chart__lb-v mn-num">{brl(data[hover].value)}</span>
          {data[hover].budget != null ? (
            <span className="mn-chart__lb-s">
              {pct((data[hover].value / data[hover].budget) * 100)} do orçamento de{' '}
              {brl(data[hover].budget)}
            </span>
          ) : null}
        </div>
      ) : (
        <p className="mn-chart__key" aria-hidden="true">
          <span className="mn-chart__key-bar" />
          Gasto do mês
          <span className="mn-chart__key-tick" />
          Orçamento definido
          <span className="mn-chart__key-over">
            <Icon name="bell" size={13} />
            acima do limite
          </span>
        </p>
      )}

      {tableView !== 'none' ? (
        <DataTable
          hidden={tableView === 'hidden'}
          caption="Despesas por categoria"
          head={['Categoria', 'Gasto', 'Orçamento']}
          rows={data.map((d) => [d.label, brl(d.value), d.budget != null ? brl(d.budget) : 'sem limite'])}
        />
      ) : null}
    </figure>
  );
}
