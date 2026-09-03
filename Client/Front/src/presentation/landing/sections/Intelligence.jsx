import Icon from '../ui/Icon';
import { SectionHead, Reveal, Badge } from '../ui/Primitives';
import { useReveal } from '../lib/hooks';
import { INTEL } from '../data/copy';

// ============================================================================
// 03 · Inteligência
//
// A narrativa é desenhada, não listada: cinco estações numa pauta contínua,
// cada uma com um glifo feito dos MESMOS nove pontos. Os pontos começam
// espalhados, viram coluna, viram tendência, ganham um ponto marcado e no fim
// viram uma decisão entre dois caminhos. É a mesma matéria mudando de estado,
// que é exatamente o que a frase da seção afirma.
//
// Cinco cards lado a lado diriam a mesma coisa sem mostrar nada.
// ============================================================================

const DOTS = [
  [7, 26], [15, 11], [23, 31], [31, 17], [39, 29], [47, 13], [55, 24], [63, 9], [71, 21],
];

function PipeGlyph({ stage }) {
  const common = { r: 2.6, fill: 'currentColor' };

  return (
    <svg viewBox="0 0 78 40" className="mn-pipe__glyph" aria-hidden="true" focusable="false">
      {stage === 0 &&
        DOTS.map(([x, y], i) => <circle key={i} cx={x} cy={y} {...common} opacity="0.5" />)}

      {stage === 1 && (
        <>
          <line x1="7" y1="20" x2="71" y2="20" stroke="currentColor" strokeWidth="1" opacity="0.22" />
          {DOTS.map(([x], i) => (
            <circle key={i} cx={x} cy={20} {...common} opacity="0.7" />
          ))}
        </>
      )}

      {stage === 2 && (
        <>
          <path
            d="M7 30 L71 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.32"
          />
          {DOTS.map(([x], i) => (
            <circle key={i} cx={x} cy={30 - i * 2.25} {...common} opacity="0.8" />
          ))}
        </>
      )}

      {stage === 3 && (
        <>
          <path
            d="M7 30 L31 22 L47 27 L71 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.42"
          />
          <line x1="47" y1="27" x2="47" y2="38" stroke="currentColor" strokeWidth="1" opacity="0.3" />
          <circle cx="47" cy="27" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="47" cy="27" r="1.9" fill="currentColor" />
        </>
      )}

      {stage === 4 && (
        <>
          <path
            d="M7 20 L34 20"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <path
            d="M34 20 C48 20 52 32 71 32"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.26"
          />
          <path
            d="M34 20 C48 20 52 9 71 9"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="71" cy="9" r="3.4" fill="currentColor" />
        </>
      )}
    </svg>
  );
}

export default function Intelligence() {
  const railRef = useReveal();

  return (
    <section id="inteligencia" className="mn-band mn-sec-intel" aria-labelledby="mn-intel-title">
      <div className="mn-page mn-page--wide">
        <SectionHead
          index={INTEL.index}
          eyebrow={INTEL.eyebrow}
          title={INTEL.titleA}
          titleAccent={INTEL.titleB}
          lead={INTEL.lead}
        />

        {/* a pauta: uma hairline contínua costurando as cinco estações */}
        <ol className="mn-pipe" ref={railRef}>
          {INTEL.pipeline.map((step, i) => (
            <li
              key={step.n}
              className="mn-pipe__stop"
              style={{ '--d': `${i * 110}ms` }}
            >
              <div className="mn-pipe__art">
                <PipeGlyph stage={i} />
              </div>
              <span className="mn-mono mn-pipe__n">{step.n}</span>
              <h3 className="mn-pipe__t">{step.label}</h3>
              <p className="mn-pipe__b">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="mn-intel__split">
          <Reveal className="mn-intel__aside">
            <blockquote className="mn-pull">
              <p className="mn-serif mn-pull__q">{INTEL.kicker}</p>
            </blockquote>
            <p className="mn-intel__note">
              Todo insight aponta a tela do produto que o gerou. É o que separa
              inteligência de enfeite: dá para abrir e conferir de onde saiu o número.
            </p>
          </Reveal>

          {/* o feed: UMA superfície com cinco linhas, não cinco cards soltos */}
          <Reveal className="mn-feed" delay={90}>
            <div className="mn-feed__top">
              <Badge tone="ai" icon="spark">Moneta AI</Badge>
              <span className="mn-mono mn-feed__meta">Setembro 2026</span>
            </div>

            <ul className="mn-feed__list">
              {INTEL.insights.map((insight) => (
                <li key={insight.text} className="mn-insight">
                  <span className="mn-insight__kind mn-mono">{insight.kind}</span>
                  <p className="mn-insight__text">{insight.text}</p>
                  <p className="mn-insight__src">
                    <Icon name="arrow" size={13} />
                    {insight.source}
                  </p>
                </li>
              ))}
            </ul>

            <p className="mn-feed__foot mn-mono">Dados de demonstração</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
