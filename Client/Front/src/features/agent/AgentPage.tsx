import { useEffect, useRef, useState, type SVGProps } from 'react';
import { AutomationIcon } from '../../app-shell/icons';
import { useCurrentUserId } from '../dashboard/queries';
import { sendAgentMessage, type AgentHistoryEntry } from './api';
import styles from './AgentPage.module.css';

/** Mesmo traço geométrico dos ícones do shell (app-shell/icons.tsx) --
 * não existia um ícone de "enviar" lá, então nasce aqui em vez de puxar
 * outra biblioteca só por um glifo. */
function SendIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 12l16-8-6 16-3-7-7-1Z" />
    </svg>
  );
}

interface Mensagem {
  role: 'agent' | 'user';
  texto: string;
  timestamp: Date;
}

const SUGESTOES_RAPIDAS = [
  'Gastei R$ 50 no Uber',
  'Recebi meu salário de R$ 3500',
  'Quais meus gastos do mês?',
  'Gera um relatório financeiro',
  'Como posso economizar?'
];

const MENSAGEM_INICIAL: Mensagem = {
  role: 'agent',
  texto:
    'Olá! Sou o **Moneta AI** 💡\nPosso registrar seus gastos e receitas, mostrar relatórios e dar dicas de economia.\n\nComo posso te ajudar hoje?',
  timestamp: new Date()
};

/**
 * Fase 7 -- reconstrução de /agent dentro do AppShell. Comportamento
 * idêntico ao widget antigo (AgentChat.jsx, ver histórico de commits):
 * mesmo endpoint, mesmo contrato de histórico (últimas 10 mensagens),
 * mesmas 5 sugestões rápidas. Só a casca muda -- sidebar/topbar novos,
 * tokens de design, e a cor de destaque do próprio ecrã: cobre
 * (--color-accent, "conteúdo de IA" na direção visual da Fase 0), não
 * a marca (emerald) -- em particular faz sentido aqui, é literalmente
 * a tela do agente de IA.
 */
export default function AgentPage() {
  const userId = useCurrentUserId() ?? 'default-user';

  const [mensagens, setMensagens] = useState<Mensagem[]>([MENSAGEM_INICIAL]);
  const [input, setInput] = useState('');
  const [carregando, setCarregando] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, carregando]);

  async function enviar(texto?: string) {
    const msg = (texto ?? input).trim();
    if (!msg || carregando) return;

    const historicoParaIA: AgentHistoryEntry[] = mensagens.slice(-10).map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.texto
    }));

    setInput('');
    setMensagens((prev) => [...prev, { role: 'user', texto: msg, timestamp: new Date() }]);
    setCarregando(true);

    try {
      const res = await sendAgentMessage(userId, msg, historicoParaIA);
      setMensagens((prev) => [
        ...prev,
        { role: 'agent', texto: res.resposta || 'Não entendi. Pode reformular?', timestamp: new Date() }
      ]);
    } catch {
      setMensagens((prev) => [
        ...prev,
        { role: 'agent', texto: '⚠️ Erro de conexão. Verifique sua internet e tente novamente.', timestamp: new Date() }
      ]);
    } finally {
      setCarregando(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Agente de IA</h1>
        <p className={styles.subtitle}>
          Registre gastos, veja relatórios e receba dicas de economia conversando naturalmente.
        </p>
      </div>

      <div className={styles.chatCard}>
        <div className={styles.chatHeader}>
          <div className={styles.chatHeaderIcon}>
            <AutomationIcon width={18} height={18} />
          </div>
          <div>
            <div className={styles.chatHeaderTitle}>Moneta AI</div>
            <div className={styles.chatHeaderStatus}>Assistente financeiro inteligente</div>
          </div>
        </div>

        <div className={styles.messages}>
          {mensagens.map((msg, i) => (
            <div key={i} className={[styles.msg, msg.role === 'user' ? styles.msgUser : styles.msgAgent].join(' ')}>
              {msg.role === 'agent' && (
                <div className={styles.avatar}>
                  <AutomationIcon width={16} height={16} />
                </div>
              )}
              <div className={styles.bubble}>
                <p className={styles.bubbleText}>{renderTexto(msg.texto)}</p>
                <span className={styles.time}>{formatarHora(msg.timestamp)}</span>
              </div>
            </div>
          ))}

          {carregando && (
            <div className={[styles.msg, styles.msgAgent].join(' ')}>
              <div className={styles.avatar}>
                <AutomationIcon width={16} height={16} />
              </div>
              <div className={[styles.bubble, styles.bubbleTyping].join(' ')}>
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {mensagens.length <= 1 && (
          <div className={styles.suggestions}>
            {SUGESTOES_RAPIDAS.map((s) => (
              <button key={s} type="button" className={styles.suggestion} onClick={() => enviar(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        <div className={styles.inputArea}>
          <textarea
            ref={inputRef}
            className={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem... (Enter para enviar)"
            rows={1}
            disabled={carregando}
          />
          <button
            type="button"
            className={styles.send}
            onClick={() => enviar()}
            disabled={!input.trim() || carregando}
            aria-label="Enviar mensagem"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

// Suporte a **negrito** e quebras de linha -- mesmo mini-parser do widget
// antigo, o backend do agente já responde nesse formato.
function renderTexto(texto: string) {
  const linhas = texto.split('\n');
  return linhas.map((linha, i) => {
    const partes = linha.split(/\*\*(.*?)\*\*/g);
    return (
      <span key={i}>
        {partes.map((parte, j) => (j % 2 === 1 ? <strong key={j}>{parte}</strong> : parte))}
        {i < linhas.length - 1 && <br />}
      </span>
    );
  });
}

function formatarHora(date: Date) {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
