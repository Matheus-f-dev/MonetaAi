import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { DemoTag, Meter, SectionHead } from '../components/ui';
import { Glyph } from '../components/glyphs';
import { Ring } from '../components/charts';
import { CONNECTED } from '../data/content';
import { ACCOUNTS, BALANCE_BEFORE, BUDGETS, CARD, GOAL, RECURRING, UPCOMING } from '../data/demo';
import { brl, pct, signedBrl } from '../lib/format';
import { useInView, useReducedMotion } from '../motion/hooks';
import { useOrbitDock, useOrbitMode } from '../scene/OrbitStage';
import s from '../Landing.module.css';
import c from './Connected.module.css';

interface Module {
  glyph: string;
  title: string;
  body: (drawn: boolean) => ReactNode;
}

interface Group {
  id: string;
  question: string;
  /** Posição no palco (% da largura/altura), só no desktop. */
  x: number;
  y: number;
  modules: [Module, Module];
}

// Agrupado por finalidade -- a pergunta que cada par de recursos responde --
// e não por uma lista de cartões iguais.
const GROUPS: Group[] = [
  {
    id: 'onde',
    question: 'Onde o seu dinheiro está',
    x: 17,
    y: 21,
    modules: [
      {
        glyph: 'wallet',
        title: 'Contas e carteiras',
        body: () => (
          <ul className={c.list}>
            {ACCOUNTS.map((a) => (
              <li key={a.id}>
                <span>{a.name}</span>
                <span className={c.num}>{brl(a.balance)}</span>
              </li>
            ))}
          </ul>
        ),
      },
      {
        glyph: 'card',
        title: 'Cartões e faturas',
        body: (drawn) => (
          <>
            <div className={c.big}>
              <span>Fatura de outubro</span>
              <strong className={c.num}>{brl(CARD.invoice)}</strong>
            </div>
            <Meter value={drawn ? pct(CARD.invoice, CARD.limit) : 0} />
            <span className={c.foot}>
              Fecha dia {CARD.closes} · vence dia {CARD.due}
            </span>
          </>
        ),
      },
    ],
  },
  {
    id: 'entra',
    question: 'Como ele entra',
    x: 83,
    y: 21,
    modules: [
      {
        glyph: 'spark',
        title: 'À mão ou pelo agente',
        body: () => (
          <p className={c.text}>
            Lance pelo formulário ou escreva para o agente. A categoria vem sozinha a partir da descrição.
          </p>
        ),
      },
      {
        glyph: 'upload',
        title: 'Importação de extrato',
        body: () => (
          <>
            <div className={c.file}>
              <Glyph name="file" width={16} height={16} />
              <span>extrato_outubro.ofx</span>
            </div>
            <span className={c.foot}>OFX ou CSV de qualquer banco · categorias sugeridas · repetidos avisados</span>
          </>
        ),
      },
    ],
  },
  {
    id: 'repete',
    question: 'O que se repete',
    x: 17,
    y: 79,
    modules: [
      {
        glyph: 'repeat',
        title: 'Gastos e receitas fixos',
        body: () => (
          <ul className={c.list}>
            {RECURRING.slice(0, 3).map((r) => (
              <li key={r.name}>
                <span>
                  {r.name} <em>dia {r.day}</em>
                </span>
                <span className={`${c.num} ${r.value > 0 ? c.mint : ''}`}>{signedBrl(r.value)}</span>
              </li>
            ))}
          </ul>
        ),
      },
      {
        glyph: 'calendar',
        title: 'Calendário de contas',
        body: () => (
          <ul className={c.list}>
            {UPCOMING.map((u) => (
              <li key={u.name}>
                <span>
                  <em>dia {u.day}</em> {u.name}
                </span>
                <span className={c.num}>{brl(u.value)}</span>
              </li>
            ))}
          </ul>
        ),
      },
    ],
  },
  {
    id: 'vai',
    question: 'Para onde ele vai',
    x: 83,
    y: 79,
    modules: [
      {
        glyph: 'budget',
        title: 'Orçamentos',
        body: (drawn) => (
          <ul className={c.meters}>
            {BUDGETS.map((b) => {
              const v = pct(b.spent, b.limit);
              return (
                <li key={b.category}>
                  <span className={c.meterRow}>
                    <span>{b.category}</span>
                    <span className={c.num}>{v}%</span>
                  </span>
                  <Meter value={drawn ? v : 0} tone={v >= 75 ? 'warn' : 'mint'} />
                </li>
              );
            })}
          </ul>
        ),
      },
      {
        glyph: 'goal',
        title: 'Metas',
        body: (drawn) => (
          <div className={c.goal}>
            <Ring value={pct(GOAL.saved, GOAL.target)} drawn={drawn} size={48} />
            <div>
              <strong>{GOAL.name}</strong>
              <span className={c.foot}>
                {pct(GOAL.saved, GOAL.target)}% · vinculada à {GOAL.account}
              </span>
            </div>
          </div>
        ),
      },
    ],
  },
];

export function Connected() {
  const stageRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const mode = useOrbitMode();
  const inView = useInView(stageRef, { threshold: 0.2 });
  const drawn = reduced || inView;
  const [hot, setHot] = useState<string | null>(null);

  // A peça vira o anel do saldo consolidado: tudo converge para ela.
  useOrbitDock('recursos', hubRef, (r) => ({
    x: r.left + r.width / 2,
    y: r.top + r.height / 2,
    radius: r.width * 0.66,
    rx: -0.14,
    ry: 0.08,
    rz: 0,
    dissolve: 0,
    scatter: 0,
    energy: 0.25,
  }));

  return (
    <section id="recursos" className={`${s.section} ${s.lazyRender} ${c.connected}`} aria-labelledby="recursos-title">
      <div className={s.wrap}>
        <SectionHead
          id="recursos-title"
          eyebrow={CONNECTED.eyebrow}
          title={CONNECTED.title}
          accent={CONNECTED.accent}
          lead={CONNECTED.lead}
          className={c.head}
          align="center"
        />

        <div ref={stageRef} className={c.stage} data-drawn={drawn} data-hot={hot ?? undefined} data-live={mode === 'live'}>
          <DemoTag className={c.tag} />
          <svg className={c.wires} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {GROUPS.map((g, i) => {
              // Curva do grupo até o núcleo (50, 50), com a barriga puxada
              // para o lado de fora para não cruzar o centro em linha reta.
              const mx = (g.x + 50) / 2 + (g.y - 50) * 0.2;
              const my = (g.y + 50) / 2 - (g.x - 50) * 0.2;
              const d = `M${g.x},${g.y} Q${mx},${my} 50,50`;
              return (
                <g key={g.id} data-wire={g.id}>
                  <path d={d} className={c.wireBase} vectorEffect="non-scaling-stroke" />
                  <path d={d} className={c.wireFlow} vectorEffect="non-scaling-stroke" style={{ animationDelay: `${i * -0.8}s` }} />
                </g>
              );
            })}
          </svg>

          <div ref={hubRef} className={c.hub}>
            <span className={c.hubRing} aria-hidden="true" />
            <span className={c.hubRing2} aria-hidden="true" />
            <div className={c.hubInner}>
              <span className={c.hubLabel}>Saldo consolidado</span>
              <strong className={c.hubValue}>{brl(BALANCE_BEFORE)}</strong>
              <span className={c.hubFoot}>3 contas · 1 cartão · 1 meta</span>
            </div>
          </div>

          <ul className={c.nodes}>
            {GROUPS.map((g, i) => (
              <li
                key={g.id}
                className={c.node}
                style={{ '--x': `${g.x}%`, '--y': `${g.y}%`, '--d': `${120 + i * 90}ms` } as CSSProperties}
                data-reveal="scale"
                data-active={hot === g.id}
                onPointerEnter={() => setHot(g.id)}
                onPointerLeave={() => setHot(null)}
              >
                <h3 className={c.question}>{g.question}</h3>
                <div className={c.modules}>
                  {g.modules.map((m) => (
                    <div key={m.title} className={c.module}>
                      <div className={c.moduleHead}>
                        <span className={c.moduleIcon}>
                          <Glyph name={m.glyph} width={16} height={16} />
                        </span>
                        <span className={c.moduleTitle}>{m.title}</span>
                      </div>
                      <div className={c.moduleBody}>{m.body(drawn)}</div>
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
