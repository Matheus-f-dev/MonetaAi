import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { DemoTag, Meter } from '../components/ui';
import { Glyph } from '../components/glyphs';
import { GOALS } from '../data/content';
import { BUDGETS, GOAL } from '../data/demo';
import { brl, brl0, ease, pct, range } from '../lib/format';
import { useReducedMotion, useScrollProgress } from '../motion/hooks';
import s from '../Landing.module.css';
import g from './Goals.module.css';

const PATH = 'M30,342 C260,339 330,258 470,242 C620,223 640,160 790,138 C930,119 1010,91 1170,36';
const VB = { w: 1200, h: 380 };
const GOAL_FRACTION = GOAL.saved / GOAL.target; // 0,41
const MILESTONES = [0.25, 0.5, 0.75, 1];
const lazer = BUDGETS.find((b) => b.category === 'Lazer')!;

/**
 * A meta como um percurso. A linha se desenha com a rolagem até onde a
 * pessoa está hoje (41%), o resto do caminho fica tracejado até o destino.
 * Tudo calculado sobre o comprimento real do traço, então o marcador e os
 * marcos ficam exatamente em cima da curva em qualquer largura.
 */
export function Goals() {
  const sectionRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const drawRef = useRef<SVGPathElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const [geo, setGeo] = useState<{ len: number; marks: Array<{ x: number; y: number }> } | null>(null);
  const [reached, setReached] = useState(reduced ? GOAL_FRACTION : 0);

  // Mede o traço uma vez.
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    const marks = MILESTONES.map((f) => {
      const pt = path.getPointAtLength(len * f);
      return { x: (pt.x / VB.w) * 100, y: (pt.y / VB.h) * 100 };
    });
    setGeo({ len, marks });
  }, []);

  const apply = (e: number) => {
    const path = pathRef.current;
    const draw = drawRef.current;
    if (!path || !draw || !geo) return;
    const frac = GOAL_FRACTION * e;
    const at = geo.len * frac;
    draw.style.strokeDashoffset = String(geo.len - at);
    const pt = path.getPointAtLength(Math.max(at, 0.01));
    headRef.current?.style.setProperty('left', `${(pt.x / VB.w) * 100}%`);
    headRef.current?.style.setProperty('top', `${(pt.y / VB.h) * 100}%`);
    if (counterRef.current) counterRef.current.textContent = brl0(GOAL.saved * e);
    setReached((prev) => (Math.abs(prev - frac) > 0.004 ? frac : prev));
  };

  useScrollProgress(sectionRef, {
    mode: 'sticky',
    enabled: !reduced && geo !== null,
    onProgress: (p) => apply(ease(range(p, 0.08, 0.78))),
  });

  // Movimento reduzido (ou antes da primeira rolagem): estado final/inicial direto.
  useEffect(() => {
    if (geo) apply(reduced ? 1 : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo, reduced]);

  return (
    <section
      ref={sectionRef}
      id="metas"
      className={`${s.section} ${g.goals}`}
      data-static={reduced}
      aria-labelledby="metas-title"
    >
      <div className={g.stage}>
        <div className={`${s.wrap} ${g.layout}`}>
          <header className={g.copy}>
            <p className={s.eyebrow} data-reveal="fade">
              {GOALS.eyebrow}
            </p>
            <h2 id="metas-title" className={`${s.h2} ${s.lines} ${g.title}`} data-reveal>
              <span className={s.line} style={{ '--li': 0 } as CSSProperties}>
                <span>{GOALS.title}</span>
              </span>
              {' '}
              <span className={s.line} style={{ '--li': 1 } as CSSProperties}>
                <span className={s.accent}>{GOALS.accent}</span>
              </span>
            </h2>
            <p className={`${s.lead} ${g.lead}`} data-reveal style={{ '--d': '200ms' } as CSSProperties}>
              {GOALS.lead}
            </p>
          </header>

          <div className={g.counter} aria-hidden="true">
            <DemoTag className={g.tag} />
            <span className={g.counterLabel}>Meta · {GOAL.name}</span>
            <span ref={counterRef} className={`${g.counterValue} ${s.num}`}>
              {brl0(reduced ? GOAL.saved : 0)}
            </span>
            <span className={g.counterOf}>de {brl0(GOAL.target)}</span>
          </div>

          <figure className={g.journey}>
            <div className={g.canvas}>
              <div className={g.plot}>
                <svg viewBox={`0 0 ${VB.w} ${VB.h}`} className={g.svg} aria-hidden="true">
                  <defs>
                    <linearGradient id="mn-goal-line" x1="0" y1="1" x2="1" y2="0">
                      <stop offset="0" stopColor="#74E8AE" stopOpacity="0.35" />
                      <stop offset="1" stopColor="#B8FFD5" />
                    </linearGradient>
                  </defs>
                  <path ref={pathRef} d={PATH} className={g.future} />
                  <path
                    ref={drawRef}
                    d={PATH}
                    className={g.drawn}
                    style={geo ? { strokeDasharray: geo.len, strokeDashoffset: geo.len } : { opacity: 0 }}
                  />
                </svg>

                {geo?.marks.map((m, idx) => {
                  const f = MILESTONES[idx];
                  const lit = reached + 0.0001 >= f;
                  const last = f === 1;
                  return (
                    <div
                      key={f}
                      className={g.mark}
                      data-lit={lit}
                      data-last={last}
                      style={{ left: `${m.x}%`, top: `${m.y}%` }}
                      aria-hidden="true"
                    >
                      <span className={g.markDot} />
                      <span className={g.markLabel}>
                        {last ? (
                          <>
                            <b>{GOAL.name}</b> {brl0(GOAL.target)} · até {GOAL.deadline}
                          </>
                        ) : (
                          brl0(GOAL.target * f)
                        )}
                      </span>
                    </div>
                  );
                })}

                <div ref={headRef} className={g.head} aria-hidden="true">
                  <span className={g.headDot} />
                  <span className={g.headLabel}>Você está aqui</span>
                </div>
              </div>
              <div className={g.cards}>
                <div className={g.card} data-reveal style={{ '--d': '100ms' } as CSSProperties}>
                  <span className={g.cardIcon}>
                    <Glyph name="wallet" width={17} height={17} />
                  </span>
                  <div>
                    <span className={g.cardLabel}>Conta vinculada</span>
                    <strong>{GOAL.account}</strong>
                    <span className={`${g.cardValue} ${s.num}`}>{brl(GOAL.saved)}</span>
                  </div>
                </div>
                <div className={g.card} data-reveal style={{ '--d': '200ms' } as CSSProperties}>
                  <span className={g.cardIcon}>
                    <Glyph name="budget" width={17} height={17} />
                  </span>
                  <div className={g.cardGrow}>
                    <span className={g.cardLabel}>Orçamento de {lazer.category}</span>
                    <strong className={s.num}>
                      {brl(lazer.spent)} de {brl(lazer.limit)}
                    </strong>
                    <Meter value={pct(lazer.spent, lazer.limit)} className={g.cardMeter} />
                  </div>
                </div>
              </div>
            </div>
            <figcaption className={s.srOnly}>
              Meta {GOAL.name}: {brl(GOAL.saved)} guardados de {brl(GOAL.target)} ({pct(GOAL.saved, GOAL.target)}%),
              com prazo até {GOAL.deadline}.
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
