import { useRef } from 'react';
import { AreaChart, Ring } from './charts';
import { Glyph } from './glyphs';
import { BrandMark, Meter } from './ui';
import { useInView, useReducedMotion } from '../motion/hooks';
import {
  BALANCE_BEFORE,
  BALANCE_HISTORY,
  BUDGETS,
  CATEGORIES_BEFORE,
  EXPENSES_BEFORE,
  GOAL,
  INCOME_TOTAL,
  MONTH_LABEL,
  RECENT,
  SAVING_RATE,
  UPCOMING,
} from '../data/demo';
import { brl, pct, signedBrl } from '../lib/format';
import d from './DashboardMock.module.css';

const SIDE = ['chart', 'wallet', 'card', 'budget', 'goal', 'calendar', 'spark', 'bell'];

/**
 * O painel da Moneta em miniatura -- mesma organização da tela real
 * (/system): indicadores no topo, evolução e categorias no meio, contas a
 * vencer, orçamento e meta embaixo. Dados de data/demo.ts, estado de antes
 * do agente registrar o Uber (a seção seguinte mostra essa mudança).
 */
export function DashboardMock({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { threshold: 0.2 });
  const drawn = reduced || inView;
  const maxCat = Math.max(...CATEGORIES_BEFORE.map((c) => c.value));

  return (
    <div ref={ref} className={`${d.app} ${className ?? ''}`} data-drawn={drawn}>
      <aside className={d.side}>
        <BrandMark size={26} />
        <div className={d.sideIcons}>
          {SIDE.map((g, i) => (
            <span key={g} className={d.sideIcon} data-active={i === 0}>
              <Glyph name={g} width={17} height={17} />
            </span>
          ))}
        </div>
      </aside>

      <div className={d.main}>
        <div className={d.top}>
          <div>
            <span className={d.kicker}>Painel</span>
            <strong className={d.hello}>Olá, Bia</strong>
          </div>
          <div className={d.topRight}>
            <span className={d.month}>{MONTH_LABEL}</span>
            <span className={d.add}>+ Lançar</span>
          </div>
        </div>

        <div className={d.kpis} data-callout="saldo">
          <div className={`${d.card} ${d.kpiMain}`}>
            <span className={d.cardLabel}>Saldo disponível</span>
            <strong className={d.kpiValue}>{brl(BALANCE_BEFORE)}</strong>
            <span className={d.kpiFoot}>3 contas</span>
          </div>
          <div className={d.card}>
            <span className={d.cardLabel}>Receitas</span>
            <strong className={d.kpiValue}>{brl(INCOME_TOTAL)}</strong>
            <span className={d.kpiFoot}>2 fontes</span>
          </div>
          <div className={d.card}>
            <span className={d.cardLabel}>Despesas</span>
            <strong className={d.kpiValue}>{brl(EXPENSES_BEFORE)}</strong>
            <span className={d.kpiFoot}>23 lançamentos</span>
          </div>
          <div className={d.card}>
            <span className={d.cardLabel}>Economia do mês</span>
            <strong className={`${d.kpiValue} ${d.mint}`}>{SAVING_RATE}%</strong>
            <span className={d.kpiFoot}>da renda</span>
          </div>
        </div>

        <div className={d.row2}>
          <div className={`${d.card} ${d.evolution}`} data-callout="evolucao">
            <div className={d.cardHead}>
              <span className={d.cardTitle}>Evolução do saldo</span>
              <span className={d.chip}>6 meses</span>
            </div>
            <AreaChart
              values={BALANCE_HISTORY.map((b) => b.v)}
              labels={BALANCE_HISTORY.map((b) => b.m)}
              drawn={drawn}
              height={150}
              className={d.area}
            />
          </div>
          <div className={`${d.card} ${d.cats}`}>
            <div className={d.cardHead}>
              <span className={d.cardTitle}>Gastos por categoria</span>
            </div>
            <ul className={d.catList}>
              {CATEGORIES_BEFORE.slice(0, 5).map((c, i) => (
                <li key={c.name}>
                  <div className={d.catRow}>
                    <span>{c.name}</span>
                    <span className={d.numMuted}>{brl(c.value)}</span>
                  </div>
                  <span className={d.catTrack}>
                    <span
                      className={d.catBar}
                      style={{ width: `${(c.value / maxCat) * 100}%`, transitionDelay: `${300 + i * 80}ms` }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={d.row3}>
          <div className={d.card} data-callout="contas">
            <div className={d.cardHead}>
              <span className={d.cardTitle}>Próximas contas</span>
            </div>
            <ul className={d.bills}>
              {UPCOMING.map((u) => (
                <li key={u.name}>
                  <span className={d.billDay}>
                    <b>{u.day}</b>
                    out
                  </span>
                  <span className={d.billName}>{u.name}</span>
                  <span className={d.numMuted}>{brl(u.value)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={d.card} data-callout="orcamento">
            <div className={d.cardHead}>
              <span className={d.cardTitle}>Orçamento</span>
            </div>
            <ul className={d.budgets}>
              {BUDGETS.map((b) => {
                const v = pct(b.spent, b.limit);
                return (
                  <li key={b.category}>
                    <div className={d.catRow}>
                      <span>{b.category}</span>
                      <span className={v >= 75 ? d.warnText : d.mint}>{v}%</span>
                    </div>
                    <Meter value={drawn ? v : 0} tone={v >= 75 ? 'warn' : 'mint'} />
                  </li>
                );
              })}
            </ul>
          </div>
          <div className={`${d.card} ${d.goal}`}>
            <div className={d.cardHead}>
              <span className={d.cardTitle}>Meta</span>
            </div>
            <div className={d.goalBody}>
              <Ring value={pct(GOAL.saved, GOAL.target)} drawn={drawn} size={66} />
              <div>
                <strong className={d.goalName}>{GOAL.name}</strong>
                <span className={d.numMuted}>
                  {brl(GOAL.saved)} de {brl(GOAL.target)}
                </span>
                <span className={d.goalPct}>{pct(GOAL.saved, GOAL.target)}% · até {GOAL.deadline}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`${d.card} ${d.recent}`}>
          <div className={d.cardHead}>
            <span className={d.cardTitle}>Movimentações recentes</span>
          </div>
          <ul className={d.recentList}>
            {RECENT.map((r) => (
              <li key={r.desc}>
                <span className={d.recentDesc}>{r.desc}</span>
                <span className={d.recentCat}>{r.cat}</span>
                <span className={d.recentWhen}>{r.when}</span>
                <span className={r.value > 0 ? d.mint : undefined}>{signedBrl(r.value)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
