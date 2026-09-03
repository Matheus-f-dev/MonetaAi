import { useState } from 'react';
import Icon, { Mark } from '../ui/Icon';
import { Button, Badge, Delta } from '../ui/Primitives';
import { Panel, PanelRow } from '../ui/Panel';
import AreaChart from '../charts/AreaChart';
import Sparkline from '../charts/Sparkline';
import { brl } from '../lib/format';
import { useCountUp, useReveal } from '../lib/hooks';
import { HERO, CTA, ROUTES } from '../data/copy';
import {
  BALANCE, MONTH, BALANCE_SERIES, SPARK_INCOME, SPARK_EXPENSES, SPARK_FREE,
} from '../data/demo';

// ============================================================================
// Hero.
//
// O produto é o protagonista, e ele é UMA superfície coerente, não dez cards
// flutuando. A superfície conta a mecânica de cima para baixo, na ordem em que
// ela acontece de verdade:
//
//   você manda a frase  ->  o painel fecha o mês  ->  a IA explica o desvio
//
// Um único elemento sai da superfície: a notificação de alerta no canto, que
// existe porque alerta é justamente a coisa que chega sem você pedir.
// ============================================================================

function KpiCell({ label, value, spark, accent, positiveIsGood, delta, deltaLabel, started }) {
  const shown = useCountUp(value, started, 900);
  return (
    <div className="mn-kpi">
      <p className="mn-mono mn-kpi__label">{label}</p>
      <div className="mn-kpi__body">
        {/* valor de KPI: sans proporcional, não tabular, porque é isolado */}
        <p className="mn-kpi__value">{brl(shown)}</p>
        <Sparkline values={spark} accent={accent} width={72} height={26} />
      </div>
      {delta != null ? (
        <Delta value={delta} suffix="%" positiveIsGood={positiveIsGood} label={deltaLabel} />
      ) : null}
    </div>
  );
}

export default function Hero({ onNavigate }) {
  const [started, setStarted] = useState(false);
  const stageRef = useReveal(() => setStarted(true));
  const balance = useCountUp(BALANCE.value, started, 1100);

  return (
    <section className="mn-hero" aria-labelledby="mn-hero-title">
      {/* grade de razão e anel da marca: papel, não decoração flutuante */}
      <div className="mn-hero__ledger" aria-hidden="true" />
      <div className="mn-hero__ring" aria-hidden="true">
        <Mark size={880} />
      </div>

      <div className="mn-hero__in mn-page mn-page--wide">
        <div className="mn-hero__copy">
          <Badge tone="brand" icon="spark">{HERO.eyebrow}</Badge>

          <h1 id="mn-hero-title" className="mn-h1 mn-hero__title">
            {HERO.titleA}{' '}
            <span className="mn-serif mn-hero__title-b">{HERO.titleB}</span>
          </h1>

          <p className="mn-lead mn-hero__lead">{HERO.lead}</p>

          <div className="mn-hero__ctas">
            <Button variant="solid" size="lg" onClick={() => onNavigate(ROUTES.signup)}>
              {CTA.primary}
            </Button>
            <Button variant="text" size="lg" as="a" href="#como-funciona" icon="arrow">
              {CTA.secondary}
            </Button>
          </div>

          <p className="mn-hero__note">
            <Icon name="check" size={14} />
            {HERO.note}
          </p>
        </div>

        <div className="mn-hero__stage" ref={stageRef}>
          <Panel className="mn-hero__panel" path={HERO.panelPath}>
            {/* 1 · a entrada */}
            <PanelRow label={HERO.captureLabel} className="mn-cap">
              <div className="mn-cap__in">
                <Icon name="chat" size={16} className="mn-cap__icon" />
                <p className="mn-cap__text">{HERO.captureText}</p>
              </div>
              <Icon name="arrow" size={16} className="mn-cap__arrow" />
              <ul className="mn-cap__out">
                {HERO.captureResolved.map((field) => (
                  <li key={field} className="mn-chip">{field}</li>
                ))}
              </ul>
            </PanelRow>

            {/* 2 · o mês fechado. Uma figura de destaque, só uma. */}
            <PanelRow className="mn-sum">
              <div className="mn-sum__top">
                <div>
                  <p className="mn-mono mn-sum__label">{BALANCE.label}</p>
                  <p className="mn-sum__value">{brl(balance)}</p>
                </div>
                <Delta value={BALANCE.deltaPct} suffix="%" label="vs agosto" />
              </div>
              <AreaChart
                data={BALANCE_SERIES}
                height={168}
                label="Saldo consolidado nos últimos 12 meses"
                tableView="hidden"
                id="hero-saldo"
              />
            </PanelRow>

            <PanelRow className="mn-kpis">
              <KpiCell
                label="Receitas"
                value={MONTH.income}
                spark={SPARK_INCOME}
                accent="var(--series-1)"
                started={started}
                delta={2.1}
                deltaLabel="no mês"
                positiveIsGood
              />
              <KpiCell
                label="Despesas"
                value={MONTH.expenses}
                spark={SPARK_EXPENSES}
                accent="var(--series-2)"
                started={started}
                delta={-4.5}
                deltaLabel="no mês"
                positiveIsGood={false}
              />
              <KpiCell
                label="Folga do mês"
                value={MONTH.free}
                spark={SPARK_FREE}
                accent="var(--series-1)"
                started={started}
              />
            </PanelRow>

            {/* 3 · a inteligência. A única linha em cobre da superfície. */}
            <PanelRow className="mn-ai" tone="ai">
              <Badge tone="ai" icon="spark">Moneta AI</Badge>
              <p className="mn-ai__text">
                Alimentação subiu <b>18%</b> em relação à sua média dos últimos 3 meses.
              </p>
            </PanelRow>
          </Panel>

          {/* o único elemento fora da superfície, e ele tem motivo */}
          <div className="mn-toast" aria-hidden="true">
            <span className="mn-toast__icon"><Icon name="bell" size={15} /></span>
            <span className="mn-toast__body">
              <b>Transporte</b> chegou a 90% do orçamento
              <em>agora mesmo</em>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
