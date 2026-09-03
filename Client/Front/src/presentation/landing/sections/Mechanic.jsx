import { useState } from 'react';
import Icon from '../ui/Icon';
import { SectionHead, Reveal } from '../ui/Primitives';
import { useRovingTabs } from '../lib/hooks';
import { MECHANIC } from '../data/copy';
import { CAPTURES } from '../data/demo';

// ============================================================================
// 02 · Como funciona
//
// Três canais de entrada, um lançamento no fim. As abas são manuais de
// propósito: um carrossel que troca sozinho tira do visitante o controle de
// olhar o que ele quer olhar, e ainda faz a página se mexer sem motivo.
//
// Teclado: role="tablist" com roving tabindex e setas, do jeito que o padrão
// ARIA pede.
// ============================================================================
const ICONS = { texto: 'chat', foto: 'camera', voz: 'mic' };

export default function Mechanic() {
  const [active, setActive] = useState(0);
  const { onKeyDown, register } = useRovingTabs(CAPTURES.length, active, setActive);
  const current = CAPTURES[active];

  return (
    <section
      id="como-funciona"
      className="mn-band mn-band--sunk mn-sec-mech"
      aria-labelledby="mn-mech-title"
    >
      <div className="mn-page">
        <SectionHead
          index={MECHANIC.index}
          eyebrow={MECHANIC.eyebrow}
          title={MECHANIC.title}
          lead={MECHANIC.lead}
        />

        <Reveal className="mn-mech">
          <div
            className="mn-mech__tabs"
            role="tablist"
            aria-label="Forma de registrar"
            onKeyDown={onKeyDown}
          >
            {CAPTURES.map((c, i) => (
              <button
                key={c.id}
                ref={register(i)}
                type="button"
                role="tab"
                id={`mn-mech-tab-${c.id}`}
                aria-selected={i === active}
                aria-controls="mn-mech-panel"
                tabIndex={i === active ? 0 : -1}
                className={`mn-mech__tab${i === active ? ' is-on' : ''}`}
                onClick={() => setActive(i)}
              >
                <Icon name={ICONS[c.id]} size={17} />
                {c.tab}
              </button>
            ))}
          </div>

          <div
            className="mn-mech__stage"
            id="mn-mech-panel"
            role="tabpanel"
            aria-labelledby={`mn-mech-tab-${current.id}`}
          >
            {/* entrada */}
            <div className="mn-mech__in">
              <p className="mn-mono mn-mech__hint">{current.hint}</p>
              <div className="mn-mech__bubble">
                <Icon name={ICONS[current.id]} size={18} className="mn-mech__bicon" />
                <p key={current.id} className="mn-mech__raw">{current.input}</p>
              </div>
            </div>

            {/* a seta é a transformação, então ela é o eixo da composição */}
            <div className="mn-mech__link" aria-hidden="true">
              <span className="mn-mech__line" />
              <span className="mn-mech__node">
                <Icon name="spark" size={15} />
              </span>
              <span className="mn-mech__line" />
            </div>

            {/* saída */}
            <div className="mn-mech__out">
              <p className="mn-mono mn-mech__hint is-brand">{MECHANIC.resolvedLabel}</p>
              <dl key={current.id} className="mn-mech__fields">
                {current.fields.map(([k, v], i) => (
                  <div key={k} className="mn-mech__field" style={{ '--d': `${i * 60}ms` }}>
                    <dt className="mn-mech__k">{k}</dt>
                    <dd className={`mn-mech__v${k === 'Valor' ? ' mn-num is-value' : ''}`}>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Reveal>

        <ol className="mn-steps">
          {MECHANIC.steps.map((step, i) => (
            <Reveal as="li" key={step.n} delay={i * 80} className="mn-steps__item">
              <span className="mn-mono mn-steps__n">{step.n}</span>
              <h3 className="mn-steps__t">{step.label}</h3>
              <p className="mn-steps__b">{step.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
