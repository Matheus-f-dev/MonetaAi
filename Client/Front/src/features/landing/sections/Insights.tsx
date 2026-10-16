import { useRef, type CSSProperties } from 'react';
import { DemoTag, SectionHead } from '../components/ui';
import { ColumnChart, Gauge, ScenarioChart } from '../components/charts';
import { Glyph } from '../components/glyphs';
import { INSIGHTS } from '../data/content';
import {
  BELOW_AVG,
  CATEGORIES_AFTER,
  EXPENSE_AVG,
  EXPENSE_HISTORY,
  EXPENSES_AFTER,
  IMPACT,
  PROJECTION,
  TRANSPORT_AFTER,
} from '../data/demo';
import { health, initialState, send } from '../data/sandbox';
import { brl, brl0, pct } from '../lib/format';
import { useCountUp, useInView, useReducedMotion } from '../motion/hooks';
import s from '../Landing.module.css';
import i from './Insights.module.css';

// O mês desta seção é o mesmo da demonstração depois do Uber registrado, e a
// nota de saúde sai da mesma função que o app usa (financialHealth.ts).
const HEALTH = health(send(initialState(), 'Gastei 45 no Uber'));

export function Insights() {
  const gridRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(gridRef, { threshold: 0.15 });
  const drawn = reduced || inView;
  const below = useCountUp(BELOW_AVG, drawn, 1600);
  const cats = [...CATEGORIES_AFTER].sort((a, b) => b.value - a.value);

  return (
    <section id="analises" className={`${s.section} ${s.lazyRender} ${i.insights}`} aria-labelledby="analises-title">
      <div className={s.wrap}>
        <SectionHead
          id="analises-title"
          eyebrow={INSIGHTS.eyebrow}
          title={INSIGHTS.title}
          accent={INSIGHTS.accent}
          lead={INSIGHTS.lead}
          className={i.head}
        />

        <DemoTag className={i.tag} />
        <div ref={gridRef} className={i.grid}>
          {/* Evolução: o número em destaque e as colunas contra a média. */}
          <article data-glow className={`${i.card} ${i.evolution}`} data-reveal style={{ '--d': '0ms' } as CSSProperties}>
            <header className={i.cardHead}>
              <h3 className={i.cardTitle}>Evolução dos gastos</h3>
              <span className={i.tag}>6 meses</span>
            </header>
            <p className={i.statement}>
              <strong className={s.num}>{brl0(below)}</strong>
              <span>abaixo da sua média</span>
            </p>
            <p className={i.explain}>
              Até aqui, outubro somou {brl(EXPENSES_AFTER)} em despesas, contra uma média de {brl(EXPENSE_AVG)} nos
              últimos cinco meses.
            </p>
            <ColumnChart
              values={EXPENSE_HISTORY.map((e) => e.v)}
              labels={EXPENSE_HISTORY.map((e) => e.m)}
              average={EXPENSE_AVG}
              highlightLast
              drawn={drawn}
              className={i.columns}
            />
          </article>

          {/* Distribuição por categoria. */}
          <article data-glow className={`${i.card} ${i.split}`} data-reveal style={{ '--d': '120ms' } as CSSProperties}>
            <header className={i.cardHead}>
              <h3 className={i.cardTitle}>Para onde o dinheiro vai</h3>
              <span className={i.tag}>outubro</span>
            </header>
            <ul className={i.bars}>
              {cats.map((c, idx) => {
                const v = pct(c.value, EXPENSES_AFTER);
                return (
                  <li key={c.name}>
                    <span className={i.barName}>{c.name}</span>
                    <span className={i.barTrack}>
                      <span
                        className={i.barFill}
                        data-top={idx === 0}
                        style={{ width: drawn ? `${(c.value / cats[0].value) * 100}%` : 0, transitionDelay: `${idx * 70}ms` }}
                      />
                    </span>
                    <span className={`${i.barValue} ${s.num}`}>{v}%</span>
                  </li>
                );
              })}
            </ul>
            <p className={i.tip}>
              <Glyph name="spark" width={16} height={16} />
              <span>
                Transporte já é {pct(TRANSPORT_AFTER, EXPENSES_AFTER)}% do mês. Transporte público ou carona ajudam a
                segurar essa conta.
              </span>
            </p>
          </article>

          {/* Projeção em cenários. */}
          <article data-glow className={`${i.card} ${i.projection}`} data-reveal style={{ '--d': '60ms' } as CSSProperties}>
            <header className={i.cardHead}>
              <h3 className={i.cardTitle}>Previsão de saldo</h3>
              <span className={i.tag}>próximos 6 meses</span>
            </header>
            <ScenarioChart
              start={PROJECTION.start}
              monthly={PROJECTION.monthly}
              labels={PROJECTION.months}
              drawn={drawn}
            />
            <p className={i.note}>{INSIGHTS.projectionNote}</p>
          </article>

          {/* Impacto de uma compra. */}
          <article data-glow className={`${i.card} ${i.impact}`} data-reveal style={{ '--d': '180ms' } as CSSProperties}>
            <header className={i.cardHead}>
              <h3 className={i.cardTitle}>Impacto de uma compra</h3>
            </header>
            <div className={i.purchase}>
              <span className={i.purchaseItem}>{IMPACT.item}</span>
              <strong className={s.num}>{brl(IMPACT.value)}</strong>
            </div>
            <dl className={i.facts}>
              <div>
                <dt>da sua renda mensal</dt>
                <dd className={s.num}>{IMPACT.incomePct}%</dd>
              </div>
              <div>
                <dt>para juntar no seu ritmo</dt>
                <dd className={s.num}>{IMPACT.monthsToSave} meses</dd>
              </div>
            </dl>
          </article>

          {/* Saúde financeira. */}
          <article data-glow className={`${i.card} ${i.health}`} data-reveal style={{ '--d': '240ms' } as CSSProperties}>
            <header className={i.cardHead}>
              <h3 className={i.cardTitle}>Saúde financeira</h3>
            </header>
            <div className={i.healthBody}>
              <Gauge value={HEALTH.score} drawn={drawn} label={HEALTH.bandLabel} />
              <ul className={i.factors}>
                {HEALTH.breakdown.map((b) => (
                  <li key={b.label}>
                    <span>
                      {b.label} <em>peso {b.weightPercent}%</em>
                    </span>
                    <b>{b.score}</b>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
