import { useState } from 'react';
import Icon from '../ui/Icon';
import { SectionHead, Reveal, Delta } from '../ui/Primitives';
import { Panel, PanelRow } from '../ui/Panel';
import AreaChart from '../charts/AreaChart';
import CategoryBars from '../charts/CategoryBars';
import FlowChart from '../charts/FlowChart';
import ScenarioChart from '../charts/ScenarioChart';
import { Meter, GoalMeter } from '../charts/Meter';
import { brl } from '../lib/format';
import { useRovingTabs } from '../lib/hooks';
import { PRODUCT } from '../data/copy';
import {
  BALANCE, MONTH, BALANCE_SERIES, CATEGORIES, FLOW_SERIES,
  SCENARIOS, ACCOUNTS, TRANSACTIONS, BUDGETS, GOAL,
} from '../data/demo';

// ============================================================================
// 04 · O produto
//
// Uma superfície só, com quatro vistas reais do painel. Quatro telas
// empilhadas na página seriam quatro vezes o mesmo cromo pedindo atenção;
// uma superfície com abas é como o software realmente se comporta.
//
// Cada vista corresponde a uma tela que existe: Visão geral (system.jsx),
// Análises (Analytics.jsx), Projeção (FutureBalance.jsx) e Alertas
// (Alerts.jsx).
// ============================================================================

function Overview() {
  return (
    <>
      <PanelRow className="mn-ov">
        <div className="mn-ov__head">
          <div>
            <p className="mn-mono mn-ov__label">{BALANCE.label}</p>
            <p className="mn-sum__value">{brl(BALANCE.value)}</p>
            <Delta value={BALANCE.deltaPct} suffix="%" label="vs agosto" />
          </div>

          <ul className="mn-accounts">
            {ACCOUNTS.map((a) => (
              <li key={a.label} className="mn-accounts__row">
                <span className="mn-accounts__k">{a.label}</span>
                <span className={`mn-accounts__v mn-num${a.value < 0 ? ' is-neg' : ''}`}>
                  {brl(a.value)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <AreaChart
          data={BALANCE_SERIES}
          height={200}
          label="Saldo consolidado nos últimos 12 meses"
          tableView="hidden"
          id="prod-saldo"
        />
      </PanelRow>

      <PanelRow label="Últimos lançamentos" className="mn-tx">
        <div className="mn-tx__scroll">
          <table className="mn-tx__table">
            <caption className="mn-sr">Últimos lançamentos da conta de demonstração</caption>
            <thead>
              <tr>
                <th scope="col">Quando</th>
                <th scope="col">Lançamento</th>
                <th scope="col">Categoria</th>
                <th scope="col">Conta</th>
                <th scope="col" className="mn-tx__num">Valor</th>
              </tr>
            </thead>
            <tbody>
              {TRANSACTIONS.map((t) => (
                <tr key={`${t.day}-${t.name}-${t.value}`}>
                  <td className="mn-tx__day mn-mono">{t.day}</td>
                  <th scope="row" className="mn-tx__name">{t.name}</th>
                  <td><span className="mn-tag">{t.category}</span></td>
                  <td className="mn-tx__acc">{t.account}</td>
                  <td className={`mn-tx__num mn-num${t.value < 0 ? ' is-neg' : ' is-pos'}`}>
                    {t.value > 0 ? '+' : ''}{brl(t.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelRow>
    </>
  );
}

function Analysis() {
  return (
    <>
      <PanelRow label="Despesas por categoria" className="mn-anl">
        <CategoryBars data={CATEGORIES} />
      </PanelRow>
      <PanelRow label="Receitas e despesas nos últimos 6 meses" className="mn-anl">
        <FlowChart series={FLOW_SERIES} />
        <p className="mn-anl__note">
          <Icon name="spark" size={14} />
          As despesas de setembro estão <b>{brl(MONTH.expenses - MONTH.expenseAveragePrev5)}</b>{' '}
          acima da média dos cinco meses anteriores.
        </p>
      </PanelRow>
    </>
  );
}

function Forecast() {
  return (
    <PanelRow className="mn-fc">
      <ScenarioChart scenarios={SCENARIOS} />
    </PanelRow>
  );
}

function Alerts() {
  return (
    <>
      <PanelRow label="Orçamento do mês por categoria" className="mn-alr">
        <div className="mn-alr__grid">
          {BUDGETS.map((b) => (
            <Meter key={b.label} {...b} />
          ))}
        </div>
      </PanelRow>
      <PanelRow label="Meta" className="mn-alr">
        <GoalMeter {...GOAL} />
      </PanelRow>
    </>
  );
}

const PANES = { geral: Overview, analises: Analysis, projecao: Forecast, alertas: Alerts };

export default function Product() {
  const [active, setActive] = useState(0);
  const { onKeyDown, register } = useRovingTabs(PRODUCT.tabs.length, active, setActive);
  const tab = PRODUCT.tabs[active];
  const pane = PRODUCT.panes[tab.id];
  const Pane = PANES[tab.id];

  return (
    <section id="produto" className="mn-band mn-sec-prod" aria-labelledby="mn-prod-title">
      <div className="mn-page mn-page--wide">
        <SectionHead
          index={PRODUCT.index}
          eyebrow={PRODUCT.eyebrow}
          title={PRODUCT.title}
          lead={PRODUCT.lead}
        />

        <Reveal className="mn-prod">
          <div className="mn-prod__bar">
            <div
              className="mn-prod__tabs"
              role="tablist"
              aria-label="Vistas do painel"
              onKeyDown={onKeyDown}
            >
              {PRODUCT.tabs.map((t, i) => (
                <button
                  key={t.id}
                  ref={register(i)}
                  type="button"
                  role="tab"
                  id={`mn-prod-tab-${t.id}`}
                  aria-selected={i === active}
                  aria-controls="mn-prod-panel"
                  tabIndex={i === active ? 0 : -1}
                  className={`mn-prod__tab${i === active ? ' is-on' : ''}`}
                  onClick={() => setActive(i)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <p className="mn-mono mn-prod__demo">
              <span className="mn-prod__demodot" aria-hidden="true" />
              {PRODUCT.demoNote}
            </p>
          </div>

          <div
            className="mn-prod__body"
            id="mn-prod-panel"
            role="tabpanel"
            aria-labelledby={`mn-prod-tab-${tab.id}`}
          >
            <div className="mn-prod__caption">
              <h3 className="mn-h3">{pane.title}</h3>
              <p className="mn-prod__captionb">{pane.body}</p>
            </div>

            <Panel key={tab.id} path={`monetaai.site/app/${tab.id}`} className="mn-prod__panel">
              <Pane />
            </Panel>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
