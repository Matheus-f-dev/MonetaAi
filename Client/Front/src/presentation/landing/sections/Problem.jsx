import { SectionHead, Reveal } from '../ui/Primitives';
import { useReveal } from '../lib/hooks';
import { PROBLEM } from '../data/copy';

// ============================================================================
// 01 · Problema
//
// A animação desta seção existe porque ELA É O ARGUMENTO: trinta lançamentos
// tortos, em alturas e larguras diferentes, que se alinham numa pauta quando a
// seção entra na tela. Caos virando ordem, que é literalmente o que o produto
// faz. Sob prefers-reduced-motion a pauta já nasce alinhada e o argumento
// continua legível, só sem o trajeto.
// ============================================================================

// Deslocamentos fixos, não aleatórios: o mesmo desenho em toda visita e em
// todo build, e nada de Math.random durante a renderização.
const SLIVERS = [
  { w: 62, x: -14, r: -1.6 }, { w: 88, x: 22, r: 0.9 },  { w: 41, x: -30, r: 2.1 },
  { w: 74, x: 11, r: -0.6 },  { w: 95, x: -21, r: 1.4 }, { w: 53, x: 34, r: -2.3 },
  { w: 80, x: -8, r: 0.4 },   { w: 46, x: 26, r: 1.8 },  { w: 91, x: -25, r: -1.1 },
  { w: 58, x: 16, r: 2.4 },   { w: 71, x: -33, r: -0.8 },{ w: 86, x: 7, r: 1.2 },
  { w: 49, x: 29, r: -1.9 },  { w: 93, x: -17, r: 0.6 }, { w: 65, x: 20, r: 1.6 },
  { w: 77, x: -27, r: -2.2 }, { w: 44, x: 13, r: 0.8 },  { w: 89, x: -11, r: -1.4 },
  { w: 56, x: 31, r: 2.0 },   { w: 83, x: -23, r: -0.5 },{ w: 68, x: 9, r: 1.7 },
  { w: 47, x: 24, r: -2.1 },  { w: 96, x: -19, r: 1.0 }, { w: 61, x: 28, r: -1.3 },
  { w: 79, x: -31, r: 0.7 },  { w: 51, x: 15, r: 2.2 },  { w: 87, x: -6, r: -0.9 },
  { w: 64, x: 33, r: 1.5 },   { w: 73, x: -13, r: -1.8 },{ w: 43, x: 18, r: 0.3 },
];

export default function Problem() {
  const ledgerRef = useReveal();

  return (
    <section className="mn-band mn-sec-problem" aria-labelledby="mn-problem-title">
      <div className="mn-page">
        <SectionHead
          index={PROBLEM.index}
          eyebrow={PROBLEM.eyebrow}
          title={PROBLEM.title}
          lead={PROBLEM.lead}
        />

        {/* a demonstração: torto à esquerda, alinhado à direita */}
        <div className="mn-chaos" ref={ledgerRef}>
          <figure className="mn-chaos__side">
            <div className="mn-chaos__field" aria-hidden="true">
              {SLIVERS.map((s, i) => (
                <span
                  key={i}
                  className="mn-chaos__row"
                  style={{
                    '--w': `${s.w}%`,
                    '--x': `${s.x}px`,
                    '--r': `${s.r}deg`,
                    '--d': `${i * 14}ms`,
                  }}
                />
              ))}
            </div>
            <figcaption className="mn-mono mn-chaos__cap">{PROBLEM.captionA}</figcaption>
          </figure>

          <figure className="mn-chaos__side mn-chaos__side--tidy">
            <div className="mn-chaos__field is-tidy" aria-hidden="true">
              {SLIVERS.map((s, i) => (
                <span
                  key={i}
                  className="mn-chaos__row"
                  style={{ '--w': `${52 + (s.w % 34)}%`, '--d': `${i * 14}ms` }}
                />
              ))}
            </div>
            <figcaption className="mn-mono mn-chaos__cap is-brand">{PROBLEM.captionB}</figcaption>
          </figure>
        </div>

        {/* as três frustrações, como pauta e não como cards */}
        <ol className="mn-friction">
          {PROBLEM.rows.map((row, i) => (
            <Reveal as="li" key={row.n} delay={i * 70} className="mn-friction__row">
              <span className="mn-mono mn-friction__n">{row.n}</span>
              <h3 className="mn-friction__action">{row.action}</h3>
              <p className="mn-friction__out">{row.outcome}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
