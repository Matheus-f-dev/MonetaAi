import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { SectionHead, Meter } from '../components/ui';
import { Glyph } from '../components/glyphs';
import { Ring } from '../components/charts';
import { CONNECTED } from '../data/content';
import { ACCOUNTS, BALANCE_BEFORE, BUDGETS, CARD, GOAL, RECURRING, UPCOMING } from '../data/demo';
import { brl, pct, signedBrl } from '../lib/format';
import { useInView, useReducedMotion } from '../motion/hooks';
import s from '../Landing.module.css';
import c from './Connected.module.css';

interface Node {
  id: string;
  glyph: string;
  title: string;
  /** Posição no anel (% do palco), só no desktop. */
  x: number;
  y: number;
  body: (drawn: boolean) => ReactNode;
}

const NODES: Node[] = [
  {
    id: 'contas',
    glyph: 'wallet',
    title: 'Contas e carteiras',
    x: 13,
    y: 15,
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
    id: 'cartoes',
    glyph: 'card',
    title: 'Cartões e faturas',
    x: 50,
    y: 9,
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
  {
    id: 'recorrentes',
    glyph: 'repeat',
    title: 'Gastos e receitas fixos',
    x: 87,
    y: 15,
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
    id: 'orcamentos',
    glyph: 'budget',
    title: 'Orçamentos',
    x: 89,
    y: 55,
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
    id: 'metas',
    glyph: 'goal',
    title: 'Metas',
    x: 72,
    y: 92,
    body: (drawn) => (
      <div className={c.goal}>
        <Ring value={pct(GOAL.saved, GOAL.target)} drawn={drawn} size={52} />
        <div>
          <strong>{GOAL.name}</strong>
          <span className={c.foot}>
            {pct(GOAL.saved, GOAL.target)}% · vinculada à {GOAL.account}
          </span>
        </div>
      </div>
    ),
  },
  {
    id: 'pagar',
    glyph: 'calendar',
    title: 'Contas a pagar',
    x: 28,
    y: 92,
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
  {
    id: 'importar',
    glyph: 'upload',
    title: 'Importação de extrato',
    x: 11,
    y: 55,
    body: () => (
      <>
        <div className={c.file}>
          <Glyph name="file" width={16} height={16} />
          <span>extrato_outubro.ofx</span>
        </div>
        <span className={c.foot}>38 lançamentos lidos · categorias sugeridas · repetidos avisados</span>
      </>
    ),
  },
];

export function Connected() {
  const stageRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(stageRef, { threshold: 0.2 });
  const drawn = reduced || inView;
  const [hot, setHot] = useState<string | null>(null);

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

        <div ref={stageRef} className={c.stage} data-drawn={drawn} data-hot={hot ?? undefined}>
          <svg className={c.wires} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {NODES.map((n, i) => {
              // Curva do módulo até o núcleo (50, 50), com a barriga puxada
              // para o lado de fora para não cruzar o centro em linha reta.
              const mx = (n.x + 50) / 2 + (n.y - 50) * 0.18;
              const my = (n.y + 50) / 2 - (n.x - 50) * 0.18;
              const d = `M${n.x},${n.y} Q${mx},${my} 50,50`;
              return (
                <g key={n.id} data-wire={n.id}>
                  <path d={d} className={c.wireBase} vectorEffect="non-scaling-stroke" />
                  <path
                    d={d}
                    className={c.wireFlow}
                    vectorEffect="non-scaling-stroke"
                    style={{ animationDelay: `${i * -0.7}s` }}
                  />
                </g>
              );
            })}
          </svg>

          <div className={c.hub}>
            <span className={c.hubRing} aria-hidden="true" />
            <span className={c.hubRing2} aria-hidden="true" />
            <div className={c.hubInner}>
              <span className={c.hubLabel}>Saldo consolidado</span>
              <strong className={c.hubValue}>{brl(BALANCE_BEFORE)}</strong>
              <span className={c.hubFoot}>3 contas · 1 cartão · 1 meta</span>
            </div>
          </div>

          <ul className={c.nodes}>
            {NODES.map((n, i) => (
              <li
                key={n.id}
                className={c.node}
                style={{ '--x': `${n.x}%`, '--y': `${n.y}%`, '--d': `${120 + i * 70}ms` } as CSSProperties}
                data-reveal="scale"
                onPointerEnter={() => setHot(n.id)}
                onPointerLeave={() => setHot(null)}
                data-active={hot === n.id}
              >
                <div className={c.nodeHead}>
                  <span className={c.nodeIcon}>
                    <Glyph name={n.glyph} width={17} height={17} />
                  </span>
                  <h3 className={c.nodeTitle}>{n.title}</h3>
                </div>
                <div className={c.nodeBody}>{n.body(drawn)}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
