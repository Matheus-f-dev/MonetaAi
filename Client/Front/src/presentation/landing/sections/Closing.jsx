import Icon, { Mark } from '../ui/Icon';
import { Button, Reveal } from '../ui/Primitives';
import { CLOSING, CTA, ROUTES } from '../data/copy';
import { BALANCE_SERIES } from '../data/demo';

// ============================================================================
// Fechamento
//
// Faixa de tinta cheia, e a composição memorável não é um gradiente: é o anel
// da marca gravado atrás e a MESMA série de saldo do hero, agora desenhada
// como um único filete atravessando a largura da página. A página abre com o
// número e fecha com a linha que ele desenhou.
// ============================================================================
function ClosingLine() {
  const values = BALANCE_SERIES.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * 1200,
    y: 90 - ((v - min) / span) * 74,
  }));

  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  return (
    <svg
      className="mn-close__line"
      viewBox="0 0 1200 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function Closing({ onNavigate }) {
  return (
    <section className="mn-band mn-band--ink mn-sec-close" aria-labelledby="mn-close-title">
      <div className="mn-close__ring" aria-hidden="true">
        <Mark size={720} />
      </div>
      <ClosingLine />

      <div className="mn-page">
        <Reveal className="mn-close">
          <h2 id="mn-close-title" className="mn-h2 mn-close__title">
            {CLOSING.titleA}{' '}
            <span className="mn-serif mn-close__accent">{CLOSING.titleB}</span>
          </h2>

          <p className="mn-close__lead">{CLOSING.lead}</p>

          <div className="mn-close__ctas">
            <Button variant="solid" size="lg" onClick={() => onNavigate(ROUTES.signup)}>
              {CTA.primary}
            </Button>
            <Button variant="outline" size="lg" onClick={() => onNavigate(ROUTES.signin)}>
              {CTA.signin}
            </Button>
          </div>

          <p className="mn-close__note">
            <Icon name="check" size={14} />
            {CLOSING.note}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
