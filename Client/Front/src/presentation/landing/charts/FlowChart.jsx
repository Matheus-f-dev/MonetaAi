import { useState } from 'react';
import { brl, brlAxis } from '../lib/format';
import { useSize, domainFor, scale } from './chartUtils';
import DataTable from './DataTable';

// Receitas x despesas: duas séries, UM eixo. Nunca dois eixos y, mesmo que as
// duas grandezas tivessem escalas diferentes, porque o alinhamento entre dois
// eixos é arbitrário e inventa uma correlação que não está no dado.
//
// Colunas agrupadas em vez de duas linhas: com seis meses as linhas convergem
// perto do fim e os rótulos de ponta grudariam um no outro. Em coluna, o par
// do mês fica lado a lado e a comparação é direta.
//
// Duas séries, então a legenda é obrigatória. Rótulo direto só no último par,
// que é o mês corrente e o único ponto que a seção comenta.
export default function FlowChart({ series, tableView = 'visible', height = 236 }) {
  const [wrapRef, width] = useSize();
  const [hover, setHover] = useState(null);

  const all = [...series.income, ...series.expenses];
  const { lo, hi, ticks } = domainFor(all, { zeroBase: true, padTop: 0.16 });

  const pad = { top: 16, right: 12, bottom: 26, left: 52 };
  const plotW = Math.max(80, width - pad.left - pad.right);
  const plotH = Math.max(70, height - pad.top - pad.bottom);
  const baseY = pad.top + plotH;

  const n = series.labels.length;
  const band = plotW / n;
  const GAP = 2;                                    // separação na cor da superfície
  const barW = Math.min(22, Math.max(7, band * 0.32));

  const y = (v) => baseY - scale(v, [lo, hi], [0, plotH]);
  const bar = (bx, v, fill) => {
    const top = y(v);
    const h = Math.max(2, baseY - top);
    const r = Math.min(4, h);
    return (
      <path
        d={`M${bx} ${baseY} V${top + r} a${r} ${r} 0 0 1 ${r} ${-r} H${bx + barW - r} a${r} ${r} 0 0 1 ${r} ${r} V${baseY} Z`}
        fill={fill}
      />
    );
  };

  return (
    <figure className="mn-chart" ref={wrapRef}>
      <p className="mn-chart__legend">
        <span className="mn-chart__lg">
          <span className="mn-chart__sw" style={{ background: 'var(--series-1)' }} />
          Receitas
        </span>
        <span className="mn-chart__lg">
          <span className="mn-chart__sw" style={{ background: 'var(--series-2)' }} />
          Despesas
        </span>
      </p>

      <svg
        className="mn-chart__svg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Receitas e despesas nos últimos ${n} meses. No último mês, receitas de ${brl(series.income[n - 1])} e despesas de ${brl(series.expenses[n - 1])}.`}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={pad.left} x2={pad.left + plotW} y1={y(t)} y2={y(t)}
              stroke="var(--grid)" strokeWidth="1" shapeRendering="crispEdges"
            />
            <text x={pad.left - 10} y={y(t) + 3.5} textAnchor="end" className="mn-chart__tick">
              {brlAxis(t)}
            </text>
          </g>
        ))}

        {series.labels.map((month, i) => {
          const cx = pad.left + band * i + band / 2;
          const leftX = cx - barW - GAP / 2;
          const rightX = cx + GAP / 2;
          const last = i === n - 1;

          return (
            <g
              key={month}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <rect
                x={pad.left + band * i} y={pad.top} width={band} height={plotH}
                fill={hover === i ? 'var(--surface-2)' : 'transparent'}
              />
              {bar(leftX, series.income[i], 'var(--series-1)')}
              {bar(rightX, series.expenses[i], 'var(--series-2)')}

              {/* Rótulo direto em UMA série só, e na última coluna: com as duas
                  etiquetas centradas em barras a 24px de distância elas se
                  sobrepõem, e separá-las na vertical desgruda cada uma da sua
                  barra. A receita fica na legenda, no hover e na tabela. */}
              {last ? (
                <text
                  x={rightX + barW / 2}
                  y={y(series.expenses[i]) - 9}
                  textAnchor="middle"
                  className="mn-chart__tip-inline"
                >
                  {brlAxis(series.expenses[i])}
                </text>
              ) : null}

              <text x={cx} y={baseY + 18} textAnchor="middle" className="mn-chart__tick">
                {month}
              </text>
            </g>
          );
        })}

        <line
          x1={pad.left} x2={pad.left + plotW} y1={baseY} y2={baseY}
          stroke="var(--axis)" strokeWidth="1" shapeRendering="crispEdges"
        />
      </svg>

      {hover !== null ? (
        <div className="mn-chart__legendbox" aria-hidden="true">
          <span className="mn-chart__lb-k">{series.labels[hover]}</span>
          <span className="mn-chart__lb-row">
            <span className="mn-chart__sw" style={{ background: 'var(--series-1)' }} />
            Receitas <b className="mn-num">{brl(series.income[hover])}</b>
          </span>
          <span className="mn-chart__lb-row">
            <span className="mn-chart__sw" style={{ background: 'var(--series-2)' }} />
            Despesas <b className="mn-num">{brl(series.expenses[hover])}</b>
          </span>
        </div>
      ) : null}

      {tableView !== 'none' ? (
        <DataTable
          hidden={tableView === 'hidden'}
          caption="Receitas e despesas por mês"
          head={['Mês', 'Receitas', 'Despesas']}
          rows={series.labels.map((m, i) => [m, brl(series.income[i]), brl(series.expenses[i])])}
        />
      ) : null}
    </figure>
  );
}
