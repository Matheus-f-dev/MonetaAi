import type { CSSProperties } from 'react';
import { OrbitAnchor } from '../scene/OrbitAnchor';
import { ROUTES, RouteCta } from '../components/ui';
import { CLOSING } from '../data/content';
import s from '../Landing.module.css';
import c from './Closing.module.css';

/**
 * O fecho: a peça volta inteira, de frente, como um portal -- o mesmo sistema
 * que abriu a página, agora sem fragmento nenhum.
 */
export function Closing() {
  return (
    <section className={`${s.section} ${c.closing}`} aria-labelledby="fecho-title">
      <div className={c.sculptureWrap} aria-hidden="true">
        <OrbitAnchor
          id="fecho"
          className={c.sculpture}
          pose={(r, view) => {
            // Complexidade -> clareza: chega desfeita e termina de se montar
            // quando o fecho está no centro da tela.
            const cy = r.top + r.height / 2;
            const k = Math.min(1, Math.max(0, 1 - (cy - view.h * 0.62) / (view.h * 0.7)));
            const e = k * k * (3 - 2 * k);
            return {
              x: r.left + r.width / 2,
              y: cy,
              radius: r.width * 0.4,
              rx: -0.18 - (1 - e) * 0.35,
              ry: 0,
              rz: (1 - e) * 0.4,
              dissolve: (1 - e) * 0.75,
              scatter: (1 - e) * 0.9,
              energy: 0.15 + e * 0.35,
              opacity: 0.85,
            };
          }}
        />
      </div>
      <div className={`${s.wrap} ${c.content}`}>
        <h2 id="fecho-title" className={`${s.h2} ${s.lines} ${c.title}`} data-reveal>
          <span className={s.line} style={{ '--li': 0 } as CSSProperties}>
            <span>{CLOSING.title}</span>
          </span>
          {' '}
          <span className={s.line} style={{ '--li': 1 } as CSSProperties}>
            <span className={s.accent}>{CLOSING.accent}</span>
          </span>
        </h2>
        <p className={`${s.lead} ${c.lead}`} data-reveal style={{ '--d': '200ms' } as CSSProperties}>
          {CLOSING.lead}
        </p>
        <div className={c.ctas} data-reveal style={{ '--d': '320ms' } as CSSProperties}>
          <RouteCta to={ROUTES.signup} arrow>
            {CLOSING.primary}
          </RouteCta>
          <RouteCta to={ROUTES.signin} variant="ghost">
            {CLOSING.secondary}
          </RouteCta>
        </div>
        <p className={c.note} data-reveal="fade" style={{ '--d': '420ms' } as CSSProperties}>
          {CLOSING.note}
        </p>
      </div>
    </section>
  );
}
