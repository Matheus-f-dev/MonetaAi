import type { CSSProperties } from 'react';
import { BrandSculpture } from '../scene/BrandSculpture';
import { ROUTES, RouteCta } from '../components/ui';
import { CLOSING } from '../data/content';
import s from '../Landing.module.css';
import c from './Closing.module.css';

/** O fecho retoma a escultura do hero, agora de frente: o mesmo sistema, visto inteiro. */
export function Closing() {
  return (
    <section className={`${s.section} ${c.closing}`} aria-labelledby="fecho-title">
      <div className={c.sculptureWrap} aria-hidden="true">
        <BrandSculpture variant="closing" className={c.sculpture} />
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
