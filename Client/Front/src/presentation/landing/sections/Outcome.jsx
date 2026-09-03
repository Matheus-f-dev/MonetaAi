import Icon from '../ui/Icon';
import { SectionHead, Reveal } from '../ui/Primitives';
import { OUTCOME } from '../data/copy';

// ============================================================================
// 07 · Resultado
//
// A seção mais curta da página, e é de propósito: quatro trocas de estado,
// antes à esquerda, depois à direita. Nenhuma métrica, porque não existe
// métrica real para citar aqui e inventar uma seria a coisa mais fácil e a
// mais errada de fazer nesta página.
// ============================================================================
export default function Outcome() {
  return (
    <section className="mn-band mn-band--tight mn-sec-out" aria-labelledby="mn-out-title">
      <div className="mn-page">
        <div className="mn-out">
          <SectionHead
            index={OUTCOME.index}
            eyebrow={OUTCOME.eyebrow}
            title={OUTCOME.titleA}
            titleAccent={OUTCOME.titleB}
            lead={OUTCOME.lead}
          />

          <Reveal as="dl" className="mn-swap" delay={80}>
            {OUTCOME.rows.map((row) => (
              <div key={row.before} className="mn-swap__row">
                <dt className="mn-swap__before">{row.before}</dt>
                <span className="mn-swap__arrow" aria-hidden="true">
                  <Icon name="arrow" size={16} />
                </span>
                <dd className="mn-swap__after">{row.after}</dd>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
