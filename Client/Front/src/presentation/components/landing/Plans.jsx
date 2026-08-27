import { useId, useState } from 'react';
import Glyph from './Glyphs';
import { CtaPlan, CtaSales } from './Ctas';
import { PLANS } from './content';

const brl = (value) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Plans({ onNavigate }) {
  const [annual, setAnnual] = useState(true);
  const switchId = useId();

  return (
    <section className="plans" id="planos">
      <div className="plans__head">
        <p className="plans__eyebrow">Planos</p>
        <h2 className="plans__title">Comece de graça. Pague quando precisar de mais.</h2>

        <div className="plans__switch">
          <span id={switchId} className="plans__switch-label">
            Cobrança
          </span>
          <div className="plans__switch-track" role="group" aria-labelledby={switchId}>
            <button
              type="button"
              className="plans__switch-option"
              aria-pressed={!annual}
              onClick={() => setAnnual(false)}
            >
              Mensal
            </button>
            <button
              type="button"
              className="plans__switch-option"
              aria-pressed={annual}
              onClick={() => setAnnual(true)}
            >
              Anual
            </button>
          </div>
          <p className="plans__switch-note" aria-live="polite">
            {annual ? 'Preço por mês, cobrado uma vez por ano.' : 'Preço por mês, cobrado a cada mês.'}
          </p>
        </div>
      </div>

      <div className="plans__rack">
        {PLANS.map((plan) => {
          const price = annual ? plan.annual : plan.monthly;
          const featured = Boolean(plan.highlight);

          return (
            <article key={plan.id} className={`plan${featured ? ' plan--featured' : ''}`}>
              {plan.badge ? <p className="plan__badge">{plan.badge}</p> : null}

              <h3 className="plan__name">{plan.name}</h3>
              <p className="plan__tagline">{plan.tagline}</p>

              <p className="plan__price">
                {plan.priceLabel ? (
                  <span className="plan__price-free">{plan.priceLabel}</span>
                ) : (
                  <>
                    <span className="plan__price-currency">R$</span>
                    <span className="plan__price-value">{brl(price)}</span>
                    <span className="plan__price-unit">por mês</span>
                  </>
                )}
              </p>

              <ul className="plan__features">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <Glyph name="check" size={17} className="plan__check" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="plan__action">
                {plan.intent === 'sales' ? (
                  <CtaSales label={plan.cta} />
                ) : (
                  <CtaPlan label={plan.cta} onNavigate={onNavigate} featured={featured} />
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
