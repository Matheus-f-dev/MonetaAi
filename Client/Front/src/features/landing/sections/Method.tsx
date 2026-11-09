import type { CSSProperties } from 'react';
import { METHOD } from '../data/content';
import s from '../Landing.module.css';
import m from './Method.module.css';

/**
 * A espinha da narrativa, dita de uma vez: cinco verbos, cada um levando ao
 * seu capítulo. Funciona como índice -- e como promessa do que vem a seguir.
 */
export function Method() {
  return (
    <section className={`${s.section} ${m.method}`} aria-labelledby="metodo-title">
      <div className={s.wrap}>
        <div className={m.head}>
          <p className={s.eyebrow} data-reveal="fade">
            {METHOD.eyebrow}
          </p>
          <h2 id="metodo-title" className={`${s.h2} ${m.title}`} data-reveal style={{ '--d': '80ms' } as CSSProperties}>
            {METHOD.title} <span className={s.accent}>{METHOD.accent}</span>
          </h2>
        </div>

        <ol className={m.steps}>
          {METHOD.steps.map((st, i) => (
            <li key={st.verb} data-reveal style={{ '--d': `${120 + i * 90}ms` } as CSSProperties}>
              <a href={st.href} className={m.step}>
                <span className={m.n}>{st.n}</span>
                <span className={m.verb}>{st.verb}</span>
                <span className={m.body}>{st.body}</span>
                <span className={m.arrow} aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M4 9h10M10 5l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
