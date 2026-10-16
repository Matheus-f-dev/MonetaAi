import { useRef, type CSSProperties } from 'react';
import { DashboardMock } from '../components/DashboardMock';
import { SectionHead } from '../components/ui';
import { PLATFORM } from '../data/content';
import { useReducedMotion, useScrollProgress } from '../motion/hooks';
import { ease } from '../lib/format';
import s from '../Landing.module.css';
import p from './Platform.module.css';

const toVars = (prog: number) => ({ '--e': ease(prog) });

export function Platform() {
  const frameRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  // O painel entra inclinado, como uma peça sobre a mesa, e assenta de frente
  // conforme chega ao centro da tela.
  // Assentado, o transform 3D sai de vez: nada de camada composta parada
  // (em renderização por software ela gera artefatos de tile).
  useScrollProgress(frameRef, {
    mode: 'enter',
    enabled: !reduced,
    vars: toVars,
    onProgress: (prog) => frameRef.current?.toggleAttribute('data-settled', prog >= 0.999),
  });

  return (
    <section id="plataforma" className={`${s.section} ${p.platform}`} aria-labelledby="plataforma-title">
      <div className={p.glow} aria-hidden="true" />
      <div className={s.wrap}>
        <SectionHead
          id="plataforma-title"
          eyebrow={PLATFORM.eyebrow}
          title={PLATFORM.title}
          accent={PLATFORM.accent}
          lead={PLATFORM.lead}
          className={p.head}
          align="center"
        />

        <div
          ref={frameRef}
          className={p.frame}
          data-settled={reduced ? '' : undefined}
          style={reduced ? ({ '--e': 1 } as CSSProperties) : undefined}
        >
          <figure className={p.figure}>
            <DashboardMock className={p.dash} />
            <figcaption className={s.srOnly}>
              Demonstração ilustrativa do painel da Moneta AI: saldo disponível, receitas, despesas, evolução do saldo
              em seis meses, gastos por categoria, próximas contas, orçamento por categoria e progresso de uma meta.
            </figcaption>
          </figure>

          <ul className={p.callouts} aria-hidden="true" data-reveal="fade" style={{ '--d': '500ms' } as CSSProperties}>
            {PLATFORM.callouts.map((c) => (
              <li key={c.id} className={p.callout} data-pos={c.id}>
                <span className={p.calloutDot} />
                {c.text}
              </li>
            ))}
          </ul>
        </div>
        <p className={p.caption}>{PLATFORM.caption}</p>
      </div>
    </section>
  );
}
