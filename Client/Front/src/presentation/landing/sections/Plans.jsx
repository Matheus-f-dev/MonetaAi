import { useState } from 'react';
import Icon from '../ui/Icon';
import { SectionHead, Reveal, Button } from '../ui/Primitives';
import { PLANS, BRAND, ROUTES } from '../data/copy';

// ============================================================================
// 08 · Planos
//
// Preços reais do produto. O seletor mensal/anual troca o número exibido e
// diz explicitamente que a cobrança anual é anual: um preço "por mês" que só
// existe no plano anual, sem essa nota, é publicidade enganosa.
// ============================================================================
const price = (value) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Plans({ onNavigate }) {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="planos" className="mn-band mn-band--sunk mn-sec-plans" aria-labelledby="mn-plans-title">
      <div className="mn-page">
        <SectionHead
          index={PLANS.index}
          eyebrow={PLANS.eyebrow}
          title={PLANS.title}
          lead={PLANS.lead}
          align="center"
        >
          <div className="mn-cycle" role="group" aria-label="Ciclo de cobrança">
            <button
              type="button"
              className={`mn-cycle__b${annual ? '' : ' is-on'}`}
              aria-pressed={!annual}
              onClick={() => setAnnual(false)}
            >
              {PLANS.toggle.monthly}
            </button>
            <button
              type="button"
              className={`mn-cycle__b${annual ? ' is-on' : ''}`}
              aria-pressed={annual}
              onClick={() => setAnnual(true)}
            >
              {PLANS.toggle.annual}
              <span className="mn-cycle__hint">{PLANS.toggle.hint}</span>
            </button>
          </div>
        </SectionHead>

        <ul className="mn-plans">
          {PLANS.items.map((plan, i) => {
            const value = annual ? plan.annual : plan.monthly;
            const free = plan.priceLabel !== null;

            return (
              <Reveal
                as="li"
                key={plan.id}
                delay={i * 80}
                className={`mn-plan${plan.highlight ? ' is-hero' : ''}`}
              >
                {plan.badge ? <span className="mn-plan__badge mn-mono">{plan.badge}</span> : null}

                <div className="mn-plan__head">
                  <h3 className="mn-plan__name">{plan.name}</h3>
                  <p className="mn-plan__tag">{plan.tagline}</p>
                </div>

                <p className="mn-plan__price">
                  {free ? (
                    <span className="mn-plan__amount">{plan.priceLabel}</span>
                  ) : (
                    <>
                      <span className="mn-plan__cur">R$</span>
                      <span className="mn-plan__amount">{price(value)}</span>
                      <span className="mn-plan__per">/mês</span>
                    </>
                  )}
                </p>
                <p className="mn-plan__cycle">
                  {free
                    ? 'Para sempre, sem cartão de crédito'
                    : annual
                      ? `Cobrado anualmente, R$ ${price(value * 12)} por ano`
                      : 'Cobrado mensalmente'}
                </p>

                <ul className="mn-plan__feats">
                  {plan.features.map((f) => (
                    <li key={f}>
                      <Icon name="check" size={15} />
                      {f}
                    </li>
                  ))}
                </ul>

                {plan.intent === 'sales' ? (
                  <Button as="a" href={BRAND.sales} variant="outline" className="mn-plan__cta">
                    {plan.cta}
                  </Button>
                ) : (
                  <Button
                    variant={plan.highlight ? 'solid' : 'outline'}
                    className="mn-plan__cta"
                    onClick={() => onNavigate(ROUTES.signup)}
                  >
                    {plan.cta}
                  </Button>
                )}
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
