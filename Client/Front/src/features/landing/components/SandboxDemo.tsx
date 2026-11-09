import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { BrandMark, DemoTag, Meter } from './ui';
import { Glyph } from './glyphs';
import { Gauge } from './charts';
import { useReducedMotion, useTween } from '../motion/hooks';
import { DEMO } from '../data/content';
import { budgetViews, health, initialState, savingRate, send, type Message, type SandboxState } from '../data/sandbox';
import { brl, pct, signedBrl } from '../lib/format';
import d from './SandboxDemo.module.css';

type Tab = 'orcamentos' | 'categorias' | 'saude';
const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'orcamentos', label: 'Orçamentos' },
  { id: 'categorias', label: 'Categorias' },
  { id: 'saude', label: 'Saúde' },
];

/** A aba que mostra o efeito de cada ação, para o painel "responder" na hora. */
function tabFor(state: SandboxState): Tab | null {
  const e = state.effect;
  if (!e) return null;
  if (e.kind === 'registrarGasto') return state.budgets.some((b) => b.categoria === e.categoria) ? 'orcamentos' : 'categorias';
  if (e.kind === 'registrarReceita' || e.kind === 'gerarRelatorio') return 'saude';
  return 'categorias';
}

/**
 * Demonstração com estado local. Toda conta sai do motor em data/sandbox.ts
 * (funções puras): este componente só desenha o estado e encaminha as
 * mensagens. Nada vai para a rede e nada é salvo.
 */
export function SandboxDemo() {
  const reduced = useReducedMotion();
  const [state, setState] = useState<SandboxState>(initialState);
  const [pending, setPending] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [tab, setTab] = useState<Tab>('orcamentos');
  const [touched, setTouched] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const submit = (text: string) => {
    const t = text.trim();
    if (!t || pending) return;
    setTouched(true);
    setInput('');
    setPending(t);
    timer.current = window.setTimeout(
      () => {
        setState((s) => send(s, t));
        setPending(null);
      },
      reduced ? 0 : 650
    );
  };

  const reset = () => {
    window.clearTimeout(timer.current);
    setPending(null);
    setInput('');
    setState(initialState());
    setTab('orcamentos');
  };

  // O painel acompanha a última ação.
  useEffect(() => {
    const next = tabFor(state);
    if (next) setTab(next);
  }, [state]);

  // Rola só a caixa da conversa (nunca a página).
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTo({ top: log.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
  }, [state.messages.length, pending, reduced]);

  const budgets = useMemo(() => budgetViews(state), [state]);
  const hr = useMemo(() => health(state), [state]);
  const cats = useMemo(
    () =>
      Object.entries(state.categories)
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1]),
    [state.categories]
  );

  const balance = useTween(state.balance);
  const income = useTween(state.income);
  const expenses = useTween(state.expenses);
  const flashKey = state.effect?.seq ?? 0;
  const effectCat = state.effect?.categoria;

  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    // Relativo à aba com foco (padrão de abas com tabindex móvel).
    const focused = TABS.findIndex((t) => `demo-tab-${t.id}` === (e.target as HTMLElement).id);
    const i = focused >= 0 ? focused : TABS.findIndex((t) => t.id === tab);
    const next = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
    setTab(next.id);
    document.getElementById(`demo-tab-${next.id}`)?.focus();
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(input);
  };

  return (
    <div className={d.demo}>
      <div className={d.topbar}>
        <DemoTag text={DEMO.badge} />
        <button type="button" className={d.reset} onClick={reset}>
          <Glyph name="repeat" width={15} height={15} />
          {DEMO.reset}
        </button>
      </div>

      <div className={d.grid}>
        {/* ---- conversa ---- */}
        <div className={d.chat} data-glow>
          <div className={d.chatHead}>
            <span className={d.avatar}>
              <BrandMark size={22} />
            </span>
            <div>
              <strong>Moneta AI</strong>
              <span>Agente financeiro · modo demonstração</span>
            </div>
            {/* No celular o painel fica abaixo da conversa: o saldo vem junto. */}
            <span key={`m${flashKey}`} className={d.mini} data-flash={flashKey > 0} aria-hidden="true">
              <em>Saldo</em>
              {brl(balance)}
            </span>
          </div>

          <div ref={logRef} className={d.log} role="log" aria-live="polite" aria-label="Conversa da demonstração">
            {state.messages.map((m) => (
              <Bubble key={m.id} message={m} />
            ))}
            {pending && (
              <>
                <p className={d.userMsg}>{pending}</p>
                <p className={d.thinking} aria-label="O agente está respondendo">
                  <span />
                  <span />
                  <span />
                </p>
              </>
            )}
          </div>

          <div className={d.actions}>
            {DEMO.groups.map((g, gi) => (
              <div key={g.label} className={d.group} role="group" aria-label={g.label}>
                <span className={d.groupLabel}>{g.label}</span>
                <div className={d.chips}>
                  {g.actions.map((a, ai) => (
                    <button
                      key={a}
                      type="button"
                      className={d.chip}
                      data-hint={!touched && gi === 0 && ai === 0}
                      disabled={pending !== null}
                      onClick={() => submit(a)}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <form className={d.inputBar} onSubmit={onSubmit}>
            <label htmlFor="demo-input" className={d.srOnly}>
              Escreva uma mensagem para o agente (demonstração)
            </label>
            <input
              id="demo-input"
              className={d.input}
              value={input}
              maxLength={80}
              autoComplete="off"
              placeholder={DEMO.placeholder}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className={d.send} aria-label="Enviar mensagem" disabled={!input.trim() || pending !== null}>
              <Glyph name="send" width={16} height={16} />
            </button>
          </form>
        </div>

        {/* ---- painel ---- */}
        <div className={d.panel} data-glow>
          <div className={d.panelHead}>
            <span>Seu painel</span>
            <span className={d.live}>
              <span />
              atualiza a cada ação
            </span>
          </div>

          <div className={d.balance}>
            <span className={d.label}>Saldo disponível</span>
            <strong key={`b${flashKey}`} className={d.balanceValue} data-flash={flashKey > 0}>
              {brl(balance)}
            </strong>
            <div className={d.kpiRow}>
              <span>
                <em>Receitas</em>
                <b className={d.pos}>{brl(income)}</b>
              </span>
              <span>
                <em>Despesas</em>
                <b>{brl(expenses)}</b>
              </span>
              <span>
                <em>Economia</em>
                <b>{savingRate(state)}%</b>
              </span>
            </div>
          </div>

          <div className={d.tabs} role="tablist" aria-label="Indicadores" onKeyDown={onTabKey}>
            {TABS.map((t) => (
              <button
                key={t.id}
                id={`demo-tab-${t.id}`}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                aria-controls={`demo-panel-${t.id}`}
                tabIndex={tab === t.id ? 0 : -1}
                className={d.tab}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div id={`demo-panel-${tab}`} role="tabpanel" aria-labelledby={`demo-tab-${tab}`} className={d.tabPanel}>
            {tab === 'orcamentos' && (
              <ul className={d.meters}>
                {budgets.map((b) => (
                  <li key={b.categoria} data-hot={effectCat === b.categoria} data-over={b.estourado}>
                    <div className={d.row}>
                      <span>{b.categoria}</span>
                      <span className={b.estourado ? d.over : b.percentual >= 75 ? d.warm : d.mint}>
                        {b.estourado ? 'estourado · ' : ''}
                        {b.percentual}%
                      </span>
                    </div>
                    <Meter value={b.percentual} tone={b.estourado || b.percentual >= 75 ? 'warn' : 'mint'} />
                    <span className={d.sub}>
                      {brl(b.gasto)} de {brl(b.limite)}
                    </span>
                  </li>
                ))}
                <li className={d.alertRule} data-fired={state.alert.fired}>
                  <Glyph name="bell" width={14} height={14} />
                  Alerta: {state.alert.categoria} acima de {brl(state.alert.limite)}
                  <b>{state.alert.fired ? 'disparou' : 'monitorando'}</b>
                </li>
              </ul>
            )}

            {tab === 'categorias' && (
              <ul className={d.cats}>
                {cats.slice(0, 6).map(([c, v]) => (
                  <li key={c} data-hot={effectCat === c}>
                    <span>{c}</span>
                    <span className={d.catTrack}>
                      <span style={{ width: `${(v / cats[0][1]) * 100}%` }} />
                    </span>
                    <span className={d.muted}>{pct(v, state.expenses)}%</span>
                  </li>
                ))}
              </ul>
            )}

            {tab === 'saude' && (
              <div className={d.health}>
                <Gauge value={hr.score} drawn label={hr.bandLabel} />
                <div className={d.healthSide}>
                  <ul className={d.factors}>
                    {hr.breakdown.map((b) => (
                      <li key={b.label}>
                        <span>
                          {b.label} <em>{b.weightPercent}%</em>
                        </span>
                        <b>{b.score}</b>
                      </li>
                    ))}
                  </ul>
                  <p className={d.healthTip}>{hr.tips[0]}</p>
                </div>
              </div>
            )}
          </div>

          <div className={d.txBlock}>
            <span className={d.label}>Últimas movimentações</span>
            <ul className={d.tx}>
              {state.tx.slice(0, 4).map((t) => (
                <li key={t.id} className={t.when === 'agora' ? d.txNew : undefined}>
                  <span>{t.desc}</span>
                  <span className={d.muted}>
                    {t.cat} · {t.when}
                  </span>
                  <span className={t.value > 0 ? d.pos : undefined}>{signedBrl(t.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <p className={d.footnote}>{DEMO.footnote}</p>
    </div>
  );
}

function Bubble({ message: m }: { message: Message }) {
  if (m.role === 'user') return <p className={d.userMsg}>{m.text}</p>;
  return (
    <div className={m.role === 'alert' ? d.alertMsg : d.agentMsg}>
      {m.role === 'alert' && <Glyph name="bell" width={15} height={15} />}
      <div>
        <p>{m.text}</p>
        {m.detail && (
          <ul className={d.detail}>
            {m.detail.map(([k, v]) => (
              <li key={k}>
                <span>{k}</span>
                <span>{v}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
