import { useEffect, useRef, type CSSProperties } from 'react';
import { OrbitAnchor } from '../scene/OrbitAnchor';
import { AnchorCta, BrandMark, Meter, ROUTES, RouteCta } from '../components/ui';
import { HERO } from '../data/content';
import {
  BALANCE_AFTER,
  BALANCE_HISTORY,
  CATEGORIES_AFTER,
  EXPENSES_AFTER,
  INCOME_TOTAL,
  MONTH_LABEL,
  TRANSPORT_AFTER,
  TRANSPORT_LIMIT,
} from '../data/demo';
import { brl, brl0, pct } from '../lib/format';
import { onScrollFrame } from '../motion/scroll';
import { useReducedMotion } from '../motion/hooks';
import s from '../Landing.module.css';
import h from './Hero.module.css';

// Linha do mini gráfico do painel (saldo de mai a out), em coordenadas 0-100.
const SPARK = (() => {
  const vals = BALANCE_HISTORY.map((b) => b.v);
  const lo = Math.min(...vals) * 0.85;
  const hi = Math.max(...vals);
  return vals
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${((i / (vals.length - 1)) * 100).toFixed(1)},${(36 - ((v - lo) / (hi - lo)) * 30).toFixed(1)}`)
    .join(' ');
})();
const TOP_CATS = [...CATEGORIES_AFTER].sort((a, b) => b.value - a.value).slice(0, 3);

/**
 * Primeira dobra. A proposta de valor aparece em menos de um segundo: a
 * manchete entra por CSS (sem esperar JS nem a cena 3D). A peça da marca
 * atraca no espaço à direita e nasce por trás do painel do produto, que
 * aparece parcialmente revelado, em perspectiva, cortado pela borda.
 */
export function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  // Parallax: cursor (--mx/--my, -1..1) e rolagem (--hp, 0..1).
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
      raf = Math.abs(tx - x) > 0.001 || Math.abs(ty - y) > 0.001 ? requestAnimationFrame(tick) : 0;
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
      </div>

      <div className={h.visual} aria-hidden="true">
        <OrbitAnchor
          id="hero"
          className={h.anchor}
          pose={(r, view) => {
            // Ao rolar, a peça gira um pouco e se afasta junto com o hero.
            const p = Math.min(1, Math.max(0, -r.top / Math.max(view.h, 1)));
            return {
              x: r.left + r.width / 2,
              y: r.top + r.height / 2,
              radius: r.width * 0.34,
              rx: -0.52 + p * 0.5,
              ry: 0.42,
              rz: 0.2 - p * 0.3,
              dissolve: 0,
              scatter: 0,
              energy: 0.15,
            };
          }}
        />

        {/* Painel do produto, parcialmente revelado. Decorativo: o painel
            completo, com contexto, está na seção Plataforma. */}
        <div className={h.slabWrap}>
          <div className={h.slab}>
            <div className={h.slabTop}>
              <BrandMark size={18} />
              <span className={h.slabTitle}>Painel</span>
              <span className={h.slabChip}>{MONTH_LABEL}</span>
            </div>
            <div className={h.slabKpis}>
              <div className={h.slabKpiMain}>
                <span>Saldo disponível</span>
                <strong className={s.num}>{brl(BALANCE_AFTER)}</strong>
              </div>
              <div>
                <span>Receitas</span>
                <strong className={s.num}>{brl(INCOME_TOTAL)}</strong>
              </div>
              <div>
                <span>Despesas</span>
                <strong className={s.num}>{brl(EXPENSES_AFTER)}</strong>
              </div>
            </div>
            <div className={h.slabBody}>
              <div className={h.slabChart}>
                <span className={h.slabLabel}>Evolução do saldo</span>
                <svg viewBox="0 0 100 40" preserveAspectRatio="none">
                  <path d={`${SPARK} L100,40 L0,40 Z`} className={h.sparkArea} />
                  <path d={SPARK} className={h.sparkLine} vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
              <ul className={h.slabCats}>
                {TOP_CATS.map((c) => (
                  <li key={c.name}>
                    <span>{c.name}</span>
                    <span className={h.slabTrack}>
                      <span style={{ width: `${(c.value / TOP_CATS[0].value) * 100}%` }} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className={h.floats}>
          <div className={`${h.float} ${h.floatChat}`} style={{ '--z': 1.6 } as CSSProperties}>
            <div className={h.floatIn} style={{ '--fd': '1350ms' } as CSSProperties}>
              <p className={h.bubbleUser}>Gastei 45 no Uber</p>
              <p className={h.bubbleAgent}>
                <span className={h.agentDot} />
                <span>
                  Despesa registrada em <b>Transporte</b>.
                </span>
              </p>
            </div>
          </div>
          <div className={`${h.float} ${h.floatBudget}`} style={{ '--z': 1 } as CSSProperties}>
            <div className={h.floatIn} style={{ '--fd': '1550ms' } as CSSProperties}>
              <div className={h.budgetRow}>
                <span>Transporte</span>
                <span className={s.num}>{transportPct}%</span>
              </div>
              <Meter value={transportPct} />
              <span className={h.floatLabel}>Orçamento {brl0(TRANSPORT_LIMIT)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Funde o pé do painel com a página: acima da composição, abaixo do texto. */}
      <span className={h.horizon} aria-hidden="true" />

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
