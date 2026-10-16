import { useEffect, useRef, type CSSProperties } from 'react';
import { BrandSculpture } from '../scene/BrandSculpture';
import { AnchorCta, Meter, ROUTES, RouteCta } from '../components/ui';
import { HERO } from '../data/content';
import { BALANCE_AFTER, TRANSPORT_AFTER, TRANSPORT_LIMIT } from '../data/demo';
import { brl, pct } from '../lib/format';
import { onScrollFrame } from '../motion/scroll';
import { useReducedMotion } from '../motion/hooks';
import s from '../Landing.module.css';
import h from './Hero.module.css';

/**
 * Primeira dobra. A proposta de valor aparece em menos de um segundo: a
 * manchete entra em três tempos por CSS (sem esperar JS nem a cena 3D), e a
 * escultura carrega depois, por trás, sem segurar nada.
 */
export function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  // Parallax: cursor (--mx/--my, -1..1) e rolagem (--hp, 0..1), escritos
  // direto no elemento. Cada cartão flutuante usa a sua própria profundidade.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || reduced) return;
    const offScroll = onScrollFrame(() => {
      const p = Math.min(1, Math.max(0, window.scrollY / Math.max(el.offsetHeight, 1)));
      el.style.setProperty('--hp', p.toFixed(4));
    });
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return offScroll;
    let raf = 0;
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    const tick = () => {
      x += (tx - x) * 0.06;
      y += (ty - y) * 0.06;
      el.style.setProperty('--mx', x.toFixed(4));
      el.style.setProperty('--my', y.toFixed(4));
      if (Math.abs(tx - x) > 0.001 || Math.abs(ty - y) > 0.001) raf = requestAnimationFrame(tick);
      else raf = 0;
    };
    const move = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      offScroll();
      window.removeEventListener('pointermove', move);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  const transportPct = pct(TRANSPORT_AFTER, TRANSPORT_LIMIT);

  return (
    <section ref={rootRef} id="topo" className={h.hero} aria-labelledby="hero-title">
      <div className={h.backdrop} aria-hidden="true">
        <span className={h.glowA} />
        <span className={h.glowB} />
        <span className={h.horizon} />
      </div>

      <div className={h.stage}>
        <BrandSculpture variant="hero" className={h.sculpture} />

        {/* Cartões de interface em três profundidades. Decorativos: o mesmo
            conteúdo é demonstrado, com contexto, nas seções seguintes. */}
        <div className={h.floats} aria-hidden="true">
          <div className={`${h.float} ${h.floatBalance}`} style={{ '--z': 1.2 } as CSSProperties}>
            <div className={h.floatIn} style={{ '--fd': '1050ms' } as CSSProperties}>
              <span className={h.floatLabel}>Saldo disponível</span>
              <strong className={`${h.floatValue} ${s.num}`}>{brl(BALANCE_AFTER)}</strong>
              <span className={h.floatDelta}>
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                  <path d="M5 8V2M2 5l3-3 3 3" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
                </svg>
                3 contas somadas
              </span>
            </div>
          </div>

          <div className={`${h.float} ${h.floatChat}`} style={{ '--z': 2 } as CSSProperties}>
            <div className={h.floatIn} style={{ '--fd': '1250ms' } as CSSProperties}>
              <p className={h.bubbleUser}>Gastei 45 no Uber</p>
              <p className={h.bubbleAgent}>
                <span className={h.agentDot} />
                <span>
                  Despesa registrada em <b>Transporte</b>.
                </span>
              </p>
            </div>
          </div>

          <div className={`${h.float} ${h.floatBudget}`} style={{ '--z': 0.7 } as CSSProperties}>
            <div className={h.floatIn} style={{ '--fd': '1450ms' } as CSSProperties}>
              <div className={h.budgetRow}>
                <span>Transporte</span>
                <span className={s.num}>{transportPct}%</span>
              </div>
              <Meter value={transportPct} />
              <span className={h.floatLabel}>Orçamento de {brl(TRANSPORT_LIMIT)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={`${s.wrap} ${h.content}`}>
        <p className={`${s.eyebrow} ${h.eyebrow}`}>{HERO.eyebrow}</p>
        <h1 id="hero-title" className={h.title}>
          {HERO.lines.map((line, i) => (
            <span key={line} className={h.titleLine} style={{ '--i': i } as CSSProperties}>
              <span className={i === 1 ? s.accent : undefined}>{line}</span>
              {i < HERO.lines.length - 1 ? ' ' : null}
            </span>
          ))}
        </h1>
        <p className={`${s.lead} ${h.lead}`}>{HERO.lead}</p>
        <div className={h.ctas}>
          <RouteCta to={ROUTES.signup} arrow>
            {HERO.primary}
          </RouteCta>
          <AnchorCta href="#plataforma">{HERO.secondary}</AnchorCta>
        </div>
        <p className={h.note}>{HERO.note}</p>
      </div>

      <a href="#problema" className={h.scrollCue}>
        <span className={h.scrollLine} aria-hidden="true">
          <span />
        </span>
        {HERO.scroll}
      </a>
    </section>
  );
}
