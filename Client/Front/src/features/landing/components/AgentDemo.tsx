import { useEffect, useRef, useState } from 'react';
import { BrandMark, Meter } from './ui';
import { Glyph } from './glyphs';
import { useInView, useReducedMotion, useTween } from '../motion/hooks';
import {
  BALANCE_AFTER,
  BALANCE_BEFORE,
  CATEGORIES_AFTER,
  EXPENSES_AFTER,
  TRANSPORT_AFTER,
  TRANSPORT_BEFORE,
  TRANSPORT_LIMIT,
  TX_COUNT_AFTER,
  UBER,
} from '../data/demo';
import { AGENT } from '../data/content';
import { brl, pct } from '../lib/format';
import a from './AgentDemo.module.css';

// Roteiro. As respostas seguem o formato real do agente (AgentService:
// _formatarListaGastos / _formatarSugestoes) com os números de data/demo.ts.
const top3 = [...CATEGORIES_AFTER].sort((x, y) => y.value - x.value).slice(0, 3);
const transportShare = pct(TRANSPORT_AFTER, EXPENSES_AFTER);

interface Exchange {
  prompt: string;
  reply: string;
  detail?: Array<[string, string]>;
}

const SCRIPT: Exchange[] = [
  {
    prompt: 'Gastei 45 no Uber',
    reply: `Despesa de ${brl(UBER)} registrada em Transporte, na Conta corrente.`,
  },
  {
    prompt: 'Quanto gastei esse mês?',
    reply: `Seus gastos este mês: ${brl(EXPENSES_AFTER)} em ${TX_COUNT_AFTER} transações. As maiores categorias:`,
    detail: top3.map((c) => [c.name, `${brl(c.value)} · ${pct(c.value, EXPENSES_AFTER)}%`]),
  },
  {
    prompt: 'Como posso economizar?',
    reply: `Transporte já é ${transportShare}% dos seus gastos do mês (${brl(TRANSPORT_AFTER)}). Considere usar transporte público ou caronas compartilhadas.`,
  },
];

type Phase = 'idle' | 'typing' | 'thinking' | 'done';

export function AgentDemo() {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { threshold: 0.35 });

  const [active, setActive] = useState(reduced ? SCRIPT.length - 1 : -1);
  const [phase, setPhase] = useState<Phase>(reduced ? 'done' : 'idle');
  const [typed, setTyped] = useState(0);
  const [auto, setAuto] = useState(true);

  const start = (i: number) => {
    setActive(i);
    setTyped(0);
    setPhase(reduced ? 'done' : 'typing');
  };

  // Começa sozinha na primeira vez que a conversa aparece na tela.
  useEffect(() => {
    if (inView && active === -1) start(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  // Máquina de estados: digita -> "pensando" -> responde -> próximo passo.
  useEffect(() => {
    if (active < 0) return;
    const prompt = SCRIPT[active].prompt;
    let t = 0;
    if (phase === 'typing') {
      t = typed < prompt.length
        ? window.setTimeout(() => setTyped((n) => n + 1), 32 + ((typed * 37) % 40))
        : window.setTimeout(() => setPhase('thinking'), 420);
    } else if (phase === 'thinking') {
      t = window.setTimeout(() => setPhase('done'), 1050);
    } else if (phase === 'done' && auto && active < SCRIPT.length - 1) {
      t = window.setTimeout(() => start(active + 1), 3000);
    }
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, phase, typed, auto]);

  // Rola só a caixa da conversa (nunca a página) até a última mensagem.
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTo({ top: log.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
  }, [active, phase, reduced]);

  const done = phase === 'done';
  const expenseIn = active > 0 || (active === 0 && done);
  const highlight = done ? (active === 1 ? 'summary' : active === 2 ? 'tip' : null) : null;

  const balance = useTween(expenseIn ? BALANCE_AFTER : BALANCE_BEFORE);
  const transport = expenseIn ? TRANSPORT_AFTER : TRANSPORT_BEFORE;
  const transportPct = pct(transport, TRANSPORT_LIMIT);

  const pick = (i: number) => {
    setAuto(false);
    start(i);
  };
  const replay = () => {
    setAuto(true);
    start(0);
  };

  return (
    <div ref={rootRef} className={a.demo}>
      <div className={a.steps} role="group" aria-label="Passos da demonstração">
        {AGENT.steps.map((st, i) => (
          <button
            key={st.id}
            type="button"
            className={a.step}
            aria-pressed={active === i}
            data-past={active > i}
            onClick={() => pick(i)}
          >
            <span className={a.stepIndex}>{i + 1}</span>
            {st.label}
          </button>
        ))}
        <button type="button" className={a.replay} onClick={replay}>
          <Glyph name="repeat" width={15} height={15} />
          Repetir
        </button>
      </div>

      <div className={a.grid}>
        {/* ---- conversa ---- */}
        <div className={a.chat} aria-hidden="true">
          <div className={a.chatHead}>
            <span className={a.avatar}>
              <BrandMark size={22} />
            </span>
            <div>
              <strong>Moneta AI</strong>
              <span>Agente financeiro</span>
            </div>
          </div>

          <div ref={logRef} className={a.log}>
            <p className={a.agentMsg}>
              Oi, Bia! Posso registrar gastos e receitas, mostrar o que você gastou e sugerir onde economizar.
            </p>
            {SCRIPT.map((ex, i) => {
              if (i > active) return null;
              const current = i === active;
              const showUser = !current || phase === 'thinking' || phase === 'done';
              const showReply = !current || phase === 'done';
              return (
                <div key={ex.prompt} className={a.exchange}>
                  {showUser && <p className={a.userMsg}>{ex.prompt}</p>}
                  {current && phase === 'thinking' && (
                    <p className={a.thinking}>
                      <span />
                      <span />
                      <span />
                    </p>
                  )}
                  {showReply && (
                    <div className={a.agentMsg} data-new={current}>
                      <p>{ex.reply}</p>
                      {ex.detail && (
                        <ul className={a.detail}>
                          {ex.detail.map(([k, v]) => (
                            <li key={k}>
                              <span>{k}</span>
                              <span>{v}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className={a.inputBar}>
            <span className={a.inputText} data-empty={!(active >= 0 && phase === 'typing')}>
              {active >= 0 && phase === 'typing' ? SCRIPT[active].prompt.slice(0, typed) : 'Escreva como você fala…'}
              {active >= 0 && phase === 'typing' && <span className={a.caret} />}
            </span>
            <span className={a.send}>
              <Glyph name="send" width={16} height={16} />
            </span>
          </div>
        </div>

        {/* ---- sinal entre a conversa e o painel ---- */}
        <span className={a.bridge} aria-hidden="true">
          <span key={expenseIn ? 'on' : 'off'} className={a.pulse} data-on={expenseIn} />
        </span>

        {/* ---- painel que reage ---- */}
        <div className={a.panel} aria-hidden="true">
          <div className={a.panelHead}>
            <span>Seu painel</span>
            <span className={a.live}>
              <span />
              atualizado agora
            </span>
          </div>

          <div className={a.balance}>
            <span className={a.label}>Saldo disponível</span>
            <strong className={a.balanceValue}>{brl(balance)}</strong>
          </div>

          <div className={a.block} data-hot={highlight === 'tip' || (expenseIn && active === 0)}>
            <div className={a.row}>
              <span>Orçamento · Transporte</span>
              <span className={transportPct >= 60 ? a.warm : a.mint}>{transportPct}%</span>
            </div>
            <Meter value={transportPct} />
            <span className={a.sub}>
              {brl(transport)} de {brl(TRANSPORT_LIMIT)}
            </span>
            {highlight === 'tip' && <span className={a.tip}>Sugestão: transporte público ou carona</span>}
          </div>

          <div className={a.block} data-hot={highlight === 'summary'}>
            <div className={a.row}>
              <span>Gastos do mês</span>
              <span className={a.muted}>{brl(expenseIn ? EXPENSES_AFTER : EXPENSES_AFTER - UBER)}</span>
            </div>
            <ul className={a.cats}>
              {top3.map((c) => {
                const v = c.name === 'Transporte' && !expenseIn ? c.value - UBER : c.value;
                const total = expenseIn ? EXPENSES_AFTER : EXPENSES_AFTER - UBER;
                return (
                  <li key={c.name}>
                    <span>{c.name}</span>
                    <span className={a.catTrack}>
                      <span style={{ width: `${pct(v, total)}%` }} />
                    </span>
                    <span className={a.muted}>{pct(v, total)}%</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className={a.block}>
            <div className={a.row}>
              <span>Últimas movimentações</span>
            </div>
            <ul className={a.tx}>
              {expenseIn && (
                <li className={a.txNew}>
                  <span>Uber</span>
                  <span className={a.muted}>Transporte · agora</span>
                  <span>− {brl(UBER)}</span>
                </li>
              )}
              <li>
                <span>Mercado</span>
                <span className={a.muted}>Alimentação · hoje</span>
                <span>− {brl(126.3)}</span>
              </li>
              <li>
                <span>Freela</span>
                <span className={a.muted}>Renda · ontem</span>
                <span className={a.mint}>+ {brl(850)}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <p className={a.srSummary}>
        Demonstração: ao escrever “Gastei 45 no Uber”, o agente registra a despesa em Transporte; o saldo passa de{' '}
        {brl(BALANCE_BEFORE)} para {brl(BALANCE_AFTER)} e o orçamento de Transporte vai de{' '}
        {pct(TRANSPORT_BEFORE, TRANSPORT_LIMIT)}% para {pct(TRANSPORT_AFTER, TRANSPORT_LIMIT)}%. Depois, o agente resume
        os gastos do mês e sugere onde economizar.
      </p>
    </div>
  );
}
