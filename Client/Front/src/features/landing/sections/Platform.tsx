import { useRef, type CSSProperties } from 'react';
import { DashboardMock } from '../components/DashboardMock';
import { DemoTag, SectionHead } from '../components/ui';
import { useOrbitDock } from '../scene/OrbitStage';
import { PLATFORM } from '../data/content';
import { useReducedMotion, useScrollProgress } from '../motion/hooks';
import { ease } from '../lib/format';
import s from '../Landing.module.css';
import p from './Platform.module.css';

const toVars = (prog: number) => ({ '--e': ease(prog) });

export function Platform() {
  const frameRef = useRef<HTMLDivElement>(null);
  const figureRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  // A peça deita e vira uma órbita sob o painel, como um pedestal de luz.
  useOrbitDock('plataforma', figureRef, (r) => ({
    x: r.left + r.width / 2,
    y: r.bottom - r.height * 0.05,
    radius: Math.min(r.width * 0.5, 640),
    rx: -1.3,
    ry: 0,
    rz: 0,
    dissolve: 0,
    scatter: 0,
    energy: 0.1,
    opacity: 0.7,
  }));
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
          <figure ref={figureRef} className={p.figure}>
            <DemoTag className={p.tag} />
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
      </div>
    </section>
  );
}
