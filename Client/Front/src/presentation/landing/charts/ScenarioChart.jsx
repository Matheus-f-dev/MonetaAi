import { useState } from 'react';
import { brl, brlAxis } from '../lib/format';
import { useSize, domainFor, scale, linePath, tickStride } from './chartUtils';
import DataTable from './DataTable';
import { useRovingTabs } from '../lib/hooks';

// Projeção de saldo em três cenários.
//
// Isto é ORDINAL, não categórico: pessimista < realista < otimista é uma
// ordem, então a cor é uma rampa de um hue só (claro para o menor, escuro para
// o maior) e o leitor vê a ordem na própria cor. Rampa validada com --ordinal
// nos dois modos.
//
// As três linhas divergem bem na borda direita, então rótulo direto na ponta
// funciona e a legenda vem do próprio seletor de cenário.
const RAMP = ['var(--ord-1)', 'var(--ord-2)', 'var(--ord-3)'];

export default function ScenarioChart({ scenarios, height = 250, tableView = 'visible' }) {
  const [wrapRef, width] = useSize();
  const [active, setActive] = useState(1);          // realista, o padrão do produto
  const { onKeyDown, register } = useRovingTabs(scenarios.length, active, setActive);

  const all = scenarios.flatMap((s) => s.points.map((p) => p.value));
  const { lo, hi, ticks } = domainFor(all, { padTop: 0.06 });

  const labelPad = Math.min(84, Math.max(52, width * 0.14));
  const pad = { top: 14, right: labelPad, bottom: 26, left: 52 };
  const plotW = Math.max(80, width - pad.left - pad.right);
  const plotH = Math.max(80, height - pad.top - pad.bottom);
  const baseY = pad.top + plotH;

  const count = scenarios[0].points.length;
  const px = (i) => pad.left + (i / (count - 1)) * plotW;
  const py = (v) => baseY - scale(v, [lo, hi], [0, plotH]);
  const stride = tickStride(count, plotW, 40);

  const current = scenarios[active];
  const final = current.points[current.points.length - 1].value;

  return (
    <div className="mn-scen" ref={wrapRef}>
      <div className="mn-scen__top">
        <div className="mn-scen__figure">
          <p className="mn-mono mn-scen__figlabel">Saldo projetado em 12 meses</p>
          {/* figura de destaque: sans proporcional, nunca serifa e nunca tabular */}
          <p className="mn-scen__figvalue">{brl(final)}</p>
          <p className="mn-scen__fignote">
            Cenário {current.label.toLowerCase()}, guardando cerca de{' '}
            <b className="mn-num">{brl(current.monthly)}</b> por mês
          </p>
        </div>

        <div
          className="mn-seg"
          role="tablist"
          aria-label="Cenário de projeção"
          onKeyDown={onKeyDown}
        >
          {scenarios.map((s, i) => (
            <button
              key={s.id}
              ref={register(i)}
              type="button"
              role="tab"
              id={`mn-scen-tab-${s.id}`}
              aria-selected={i === active}
              aria-controls="mn-scen-panel"
              tabIndex={i === active ? 0 : -1}
              className={`mn-seg__b${i === active ? ' is-on' : ''}`}
              onClick={() => setActive(i)}
            >
              <span className="mn-seg__dot" style={{ background: RAMP[i] }} aria-hidden="true" />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <figure
        className="mn-chart"
        id="mn-scen-panel"
        role="tabpanel"
        aria-labelledby={`mn-scen-tab-${current.id}`}
      >
        <svg
          className="mn-chart__svg"
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`Projeção de saldo em três cenários para 12 meses. Cenário ${current.label.toLowerCase()} termina em ${brl(final)}.`}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={pad.left} x2={pad.left + plotW} y1={py(t)} y2={py(t)}
                stroke="var(--grid)" strokeWidth="1" shapeRendering="crispEdges"
              />
              <text x={pad.left - 10} y={py(t) + 3.5} textAnchor="end" className="mn-chart__tick">
                {brlAxis(t)}
              </text>
            </g>
          ))}

          {scenarios.map((s, i) => {
            const pts = s.points.map((p, j) => ({ x: px(j), y: py(p.value) }));
            const on = i === active;
            return (
              <g key={s.id} opacity={on ? 1 : 0.42}>
                <path
                  d={linePath(pts)}
                  fill="none"
                  stroke={RAMP[i]}
                  strokeWidth={on ? 2 : 1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx={pts[pts.length - 1].x}
                  cy={pts[pts.length - 1].y}
                  r={on ? 4.5 : 3.5}
                  fill={RAMP[i]}
                  stroke="var(--chart-surface)"
                  strokeWidth="2"
                />
                <text
                  x={pts[pts.length - 1].x + 10}
                  y={pts[pts.length - 1].y + 4}
                  className={`mn-chart__endlabel${on ? ' is-on' : ''}`}
                >
                  {brlAxis(s.points[s.points.length - 1].value)}
                </text>
              </g>
            );
          })}

          <line
            x1={pad.left} x2={pad.left + plotW} y1={baseY} y2={baseY}
            stroke="var(--axis)" strokeWidth="1" shapeRendering="crispEdges"
          />
          {scenarios[0].points.map((p, i) => (
            (i % stride === 0 || i === count - 1) ? (
              <text key={p.label} x={px(i)} y={baseY + 18} textAnchor="middle" className="mn-chart__tick">
                {p.label}
              </text>
            ) : null
          ))}
        </svg>

        {tableView !== 'none' ? (
          <DataTable
            hidden={tableView === 'hidden'}
            caption="Projeção de saldo por cenário"
            head={['Mês', ...scenarios.map((s) => s.label)]}
            rows={scenarios[0].points.map((p, i) => [
              p.label,
              ...scenarios.map((s) => brl(s.points[i].value)),
            ])}
          />
        ) : null}
      </figure>
    </div>
  );
}
