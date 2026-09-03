import { SectionHead, Reveal, Button } from '../ui/Primitives';
import { QUESTIONS, BRAND } from '../data/copy';

// ============================================================================
// 09 · Perguntas
//
// <details> nativo: abre sem JavaScript, é navegável por teclado de graça e o
// browser já entrega a semântica de disclosure. Um acordeão em useState aqui
// seria trabalho a mais para chegar num resultado pior.
//
// As perguntas espelham o FAQPage do JSON-LD em index.html. Mudou aqui, muda lá.
// ============================================================================
export default function Questions() {
  return (
    <section id="perguntas" className="mn-band mn-sec-faq" aria-labelledby="mn-faq-title">
      <div className="mn-page">
        <div className="mn-faq">
          <div className="mn-faq__side">
            <SectionHead
              index={QUESTIONS.index}
              eyebrow={QUESTIONS.eyebrow}
              title={QUESTIONS.title}
            />

            <Reveal className="mn-faq__ask" delay={120}>
              <p>Ficou uma dúvida que não está aqui? A gente responde.</p>
              <Button as="a" href={BRAND.support} variant="outline" size="sm" icon="arrow">
                Falar com a gente
              </Button>
            </Reveal>
          </div>

          <Reveal as="div" className="mn-faq__list">
            {QUESTIONS.items.map((item) => (
              <details key={item.q} className="mn-q">
                <summary className="mn-q__sum">
                  <span className="mn-q__q">{item.q}</span>
                  <span className="mn-q__mark" aria-hidden="true" />
                </summary>
                <div className="mn-q__a">
                  <p>{item.a}</p>
                </div>
              </details>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
