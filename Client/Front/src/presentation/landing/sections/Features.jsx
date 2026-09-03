import Icon from '../ui/Icon';
import { SectionHead, Reveal } from '../ui/Primitives';
import { FEATURES } from '../data/copy';

// ============================================================================
// 05 · Recursos
//
// Índice editorial em pauta, não uma grade de oito cards. Oito cards com
// sombra na mesma tela é o momento em que uma landing começa a parecer
// template; oito linhas de um índice parecem o sumário de um produto que
// existe.
//
// Cada linha responde "por que isso importa pra mim", nunca só nomeia a
// funcionalidade.
// ============================================================================
export default function Features() {
  return (
    <section id="recursos" className="mn-band mn-band--sunk mn-sec-feat" aria-labelledby="mn-feat-title">
      <div className="mn-page">
        <SectionHead
          index={FEATURES.index}
          eyebrow={FEATURES.eyebrow}
          title={FEATURES.title}
          lead={FEATURES.lead}
        />

        <ul className="mn-index">
          {FEATURES.items.map((item, i) => (
            <Reveal as="li" key={item.n} delay={(i % 2) * 60} className="mn-index__row">
              <span className="mn-mono mn-index__n">{item.n}</span>
              <span className="mn-index__icon">
                <Icon name={item.icon} size={19} />
              </span>
              <div className="mn-index__text">
                <h3 className="mn-index__t">{item.title}</h3>
                <p className="mn-index__b">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
