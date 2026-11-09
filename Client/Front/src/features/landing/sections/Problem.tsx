import { useRef, type CSSProperties } from 'react';
import { PROBLEM } from '../data/content';
import { measureProgress, useReducedMotion, useScrollProgress } from '../motion/hooks';
import { useOrbitDock } from '../scene/OrbitStage';
import { ease, range } from '../lib/format';
import { BrandMark } from '../components/ui';
import { FragmentGlyph } from '../components/glyphs';
import s from '../Landing.module.css';
import p from './Problem.module.css';

// Posição dispersa de cada fragmento (em % do campo, a partir do centro),
// rotação, escala e o atraso com que ele "entra na fila". `im` é a ordem no
// extrato do celular (-1 = fica de fora no celular, para caber).
const SCATTER = [
  { sx: -30, sy: -34, sr: -9, ss: 0.92, o: 0.0, im: 0 },
  { sx: 22, sy: -40, sr: 7, ss: 0.86, o: 0.05, im: 1 },
  { sx: -38, sy: 4, sr: 12, ss: 0.8, o: 0.1, im: -1 },
  { sx: 26, sy: -6, sr: -6, ss: 0.95, o: 0.14, im: 2 },
  { sx: -12, sy: 36, sr: 5, ss: 0.84, o: 0.18, im: 3 },
  { sx: 24, sy: 30, sr: -11, ss: 0.9, o: 0.22, im: 4 },
  { sx: 6, sy: -16, sr: 14, ss: 0.78, o: 0.26, im: -1 },
  { sx: -34, sy: 40, sr: -4, ss: 0.88, o: 0.3, im: 5 },
  { sx: 12, sy: 46, sr: 8, ss: 0.82, o: 0.34, im: -1 },
];

const organized = (prog: number) => ease(range(prog, 0.06, 0.8));
const toVars = (prog: number) => ({ '--e': organized(prog) });

export function Problem() {
  const ref = useRef<HTMLElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useScrollProgress(ref, { mode: 'sticky', enabled: !reduced, vars: toVars });

  // A peça chega aqui desfeita em fragmentos, como o dinheiro espalhado, e se
  // recompõe atrás do extrato no mesmo ritmo em que os itens entram na fila.
  useOrbitDock('problema', fieldRef, (r, view) => {
    const e = reduced || !ref.current ? 1 : organized(measureProgress(ref.current, 'sticky'));
    const narrow = view.w < 760;
    return {
      x: r.left + r.width / 2,
      y: r.top + r.height / 2,
      radius: narrow ? r.width * 0.48 : Math.min(r.width * 0.62, r.height * 0.44),
      opacity: narrow ? 0.75 : 1,
      rx: -0.28 + (1 - e) * 0.3,
      ry: 0.3,
      rz: 0.12,
      dissolve: 1 - e,
      scatter: 1 - e,
      energy: e * 0.2,
    };
  });

  return (
    <section
      ref={ref}
      id="problema"
      className={`${s.section} ${p.problem}`}
      data-static={reduced}
      style={reduced ? ({ '--e': 1 } as CSSProperties) : undefined}
      aria-labelledby="problema-title"
    >
      <div className={p.stage}>
        <div className={`${s.wrap} ${p.grid}`}>
          <div className={p.copy}>
            <p className={s.eyebrow} data-reveal="fade">
              {PROBLEM.eyebrow}
            </p>
            <h2 id="problema-title" className={`${s.h2} ${s.lines} ${p.title}`} data-reveal>
              <span className={s.line} style={{ '--li': 0 } as CSSProperties}>
                <span>{PROBLEM.title}</span>
              </span>
              {' '}
              <span className={s.line} style={{ '--li': 1 } as CSSProperties}>
                <span className={s.accent}>{PROBLEM.accent}</span>
              </span>
            </h2>
            <p className={`${s.lead} ${p.lead}`} data-reveal style={{ '--d': '200ms' } as CSSProperties}>
              {PROBLEM.lead}
            </p>
            <p className={p.resolved}>
              <BrandMark size={22} />
              {PROBLEM.resolved}
            </p>
          </div>

          <div ref={fieldRef} className={p.field} aria-hidden="true">
            <div className={p.ledger}>
              <div className={p.ledgerHead}>
                <span>{PROBLEM.ledgerTitle}</span>
                <span className={p.ledgerCount}>{PROBLEM.fragments.length} itens</span>
              </div>
            </div>
            {PROBLEM.fragments.map((f, i) => {
              const sc = SCATTER[i];
              return (
                <div
                  key={f.title}
                  className={p.frag}
                  data-kind={f.kind}
                  data-mobile={sc.im >= 0}
                  style={
                    {
                      '--sx': sc.sx,
                      '--sy': sc.sy,
                      '--sr': `${sc.sr}deg`,
                      '--ss': sc.ss,
                      '--o': sc.o,
                      '--i': i,
                      '--im': Math.max(sc.im, 0),
                    } as CSSProperties
                  }
                >
                  <span className={p.glyph}>
                    <FragmentGlyph kind={f.kind} />
                  </span>
                  <span className={p.fragText}>
                    <span className={p.fragTitle}>{f.title}</span>
                    <span className={p.fragMeta}>{f.meta}</span>
                  </span>
                  <span className={p.fragCat}>{f.cat}</span>
                  <span className={`${p.fragValue} ${s.num}`} data-positive={f.value.startsWith('+')}>
                    {'final' in f ? (
                      <>
                        <span className={p.valueMessy}>{f.value}</span>
                        <span className={p.valueFinal}>{f.final}</span>
                      </>
                    ) : (
                      f.value
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
