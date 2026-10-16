import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { DemoTag, Meter } from './ui';
import { Glyph } from './glyphs';
import { useInView, useReducedMotion, useTween } from '../motion/hooks';
import { useOrbitDock, useOrbitMode } from '../scene/OrbitStage';
import { AGENT } from '../data/content';
import { BALANCE_AFTER, BALANCE_BEFORE, TRANSPORT_AFTER, TRANSPORT_BEFORE, TRANSPORT_LIMIT, UBER } from '../data/demo';
import { brl, pct } from '../lib/format';
import a from './AgentPipeline.module.css';

const MESSAGE = 'Gastei R$ 45 no Uber';
// Durações de cada etapa (ms): escreve, entende, registra, responde.
const STAGE_MS = [1500, 1700, 1300, 2200];

/**
 * O caminho de uma mensagem dentro da Moneta, na ordem em que o agente real
 * trabalha (AgentService: AILayer interpreta -> ActionExecutor executa):
 * a frase vira uma ação estruturada, a ação vira movimentação e o painel
 * responde. No centro, o "núcleo" onde a peça da marca atraca e acelera.
 */
export function AgentPipeline() {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { threshold: 0.35 });
  const mode = useOrbitMode();
  const [stage, setStage] = useState(reduced ? 4 : -1);
  const [typed, setTyped] = useState(reduced ? MESSAGE.length : 0);
  const [run, setRun] = useState(0);

  // A peça atraca no núcleo; enquanto a IA "entende", os sinais correm.
  const refresh = useOrbitDock('agente', coreRef, (r) => ({
    x: r.left + r.width / 2,
    y: r.top + r.height / 2,
    radius: r.width * 0.5,
    rx: -0.35,
    ry: 0.55,
    rz: 0.3,
    dissolve: 0,
    scatter: 0,
    energy: stage === 1 ? 1 : stage >= 0 && stage < 4 ? 0.35 : 0.15,
  }));
  useEffect(() => refresh(), [stage, refresh]);

  // Começa quando aparece na tela; "Repetir" reinicia.
  useEffect(() => {
    if (reduced || !inView) return;
    setStage(0);
    setTyped(0);
  }, [inView, run, reduced]);

  // Digitação da frase (etapa 0) e avanço das etapas.
  useEffect(() => {
    if (reduced || stage < 0 || stage >= 4) return;
    if (stage === 0 && typed < MESSAGE.length) {
      const t = window.setTimeout(() => setTyped((n) => n + 1), 38 + ((typed * 29) % 30));
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setStage((s) => s + 1), stage === 0 ? 450 : STAGE_MS[stage]);
    return () => window.clearTimeout(t);
  }, [stage, typed, reduced]);

  const parsed = stage >= 1;
  const registered = stage >= 2;
  const responded = stage >= 3;
  const balance = useTween(responded ? BALANCE_AFTER : BALANCE_BEFORE, 1100);
  const transport = responded ? TRANSPORT_AFTER : TRANSPORT_BEFORE;

  const fields: Array<[string, string]> = [
    ['ação', 'registrar gasto'],
    ['valor', brl(UBER)],
    ['categoria', 'Transporte'],
    ['descrição', 'Uber'],
    ['data', 'hoje'],
  ];

  return (
    <div ref={rootRef} className={a.pipeline} data-stage={stage}>
      <div className={a.top}>
        <ol className={a.steps}>
          {AGENT.steps.map((st, i) => (
            <li key={st.id} data-done={stage > i} data-active={stage === i}>
              <span className={a.stepIndex}>{i + 1}</span>
              {st.label}
            </li>
          ))}
        </ol>
        <div className={a.topRight}>
          <DemoTag />
          <button
            type="button"
            className={a.replay}
            onClick={() => (reduced ? undefined : setRun((n) => n + 1))}
            disabled={reduced}
          >
            <Glyph name="repeat" width={15} height={15} />
            Repetir
          </button>
        </div>
      </div>

      <div className={a.flow}>
        {/* 1. Você escreve */}
        <div className={`${a.card} ${a.message}`} data-glow>
          <span className={a.cardLabel}>Você escreve</span>
          <p className={a.phrase}>
            <span className={a.srOnly}>{MESSAGE}</span>
            {stage === 0 || stage === -1 ? (
              <>
                <span aria-hidden="true">{MESSAGE.slice(0, typed)}</span>
                {stage === 0 && <span className={a.caret} aria-hidden="true" />}
              </>
            ) : (
              <span aria-hidden="true">
                Gastei{' '}
                <mark className={a.token} data-on={parsed} data-tag="valor">
                  R$ 45
                </mark>{' '}
                no{' '}
                <mark className={a.token} data-on={parsed} data-tag="Transporte">
                  Uber
                </mark>
              </span>
            )}
          </p>
        </div>

        <span className={a.wire} data-on={stage >= 1} aria-hidden="true">
          <span />
        </span>

        {/* núcleo: a peça atraca aqui */}
        <div ref={coreRef} className={a.core} data-live={mode === 'live'} data-busy={stage === 1} aria-hidden="true">
          <span className={a.coreRing} />
          <span className={a.coreRing2} />
          <span className={a.coreLabel}>{stage === 1 ? 'entendendo' : 'Moneta AI'}</span>
        </div>

        <span className={a.wire} data-on={parsed} aria-hidden="true">
          <span />
        </span>

        {/* 2. A IA entende */}
        <div className={`${a.card} ${a.parsed}`} data-on={parsed} data-glow>
          <span className={a.cardLabel}>Ação entendida</span>
          <dl className={a.fields}>
            {fields.map(([k, v], i) => (
              <div key={k} style={{ '--i': i } as CSSProperties}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className={a.results}>
        {/* 3. A Moneta registra */}
        <div className={`${a.card} ${a.result}`} data-on={registered} data-glow>
          <span className={a.cardLabel}>Movimentação registrada</span>
          <div className={a.txRow}>
            <span className={a.txIcon}>
              <Glyph name="ride" width={17} height={17} />
            </span>
            <span className={a.txText}>
              <b>Uber</b>
              <span>Transporte · agora</span>
            </span>
            <span className={a.txValue}>− {brl(UBER)}</span>
          </div>
          <p className={a.reply}>Gasto de {brl(UBER)} em Transporte registrado com sucesso.</p>
        </div>

        {/* 4. O painel responde */}
        <div className={`${a.card} ${a.result}`} data-on={responded} data-glow>
          <span className={a.cardLabel}>O painel responde</span>
          <div className={a.effects}>
            <div>
              <span className={a.effectLabel}>Saldo disponível</span>
              <strong className={a.effectValue}>{brl(balance)}</strong>
            </div>
            <div>
              <div className={a.effectRow}>
                <span className={a.effectLabel}>Orçamento · Transporte</span>
                <span className={a.effectPct}>
                  {pct(TRANSPORT_BEFORE, TRANSPORT_LIMIT)}% → <b>{pct(transport, TRANSPORT_LIMIT)}%</b>
                </span>
              </div>
              <Meter value={pct(transport, TRANSPORT_LIMIT)} />
            </div>
          </div>
        </div>
      </div>

      <p className={a.footnote}>{AGENT.footnote}</p>
    </div>
  );
}
