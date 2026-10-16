import { useEffect, useRef, useState } from 'react';
import { onScrollFrame } from '../motion/scroll';
import { RAIL } from '../data/content';
import r from './Rail.module.css';

/**
 * O fio da página: uma linha fixa à esquerda que se preenche conforme a
 * leitura avança, com um marco por capítulo. É a costura visual entre as
 * seções e, ao mesmo tempo, um índice clicável. Só aparece em telas largas,
 * onde há margem lateral sobrando.
 */
export function Rail() {
  const fillRef = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState<string | null>(null);

  useEffect(
    () =>
      onScrollFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? window.scrollY / max : 0;
        fillRef.current?.style.setProperty('transform', `scaleY(${p.toFixed(4)})`);

        // Capítulo ativo: o último cujo topo já passou de 40% da tela.
        let current: string | null = null;
        for (const item of RAIL) {
          const el = document.getElementById(item.id);
          if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4) current = item.id;
        }
        setActive((prev) => (prev === current ? prev : current));
      }),
    []
  );

  return (
    <nav className={r.rail} aria-label="Capítulos" data-visible={active !== null}>
      <span className={r.track} aria-hidden="true">
        <span ref={fillRef} className={r.fill} />
      </span>
      <ol className={r.list}>
        {RAIL.map((item, i) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className={r.item} aria-current={active === item.id ? 'true' : undefined}>
              <span className={r.dot} aria-hidden="true" />
              <span className={r.index}>{String(i + 1).padStart(2, '0')}</span>
              <span className={r.label}>{item.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
