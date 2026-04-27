import { useState, useRef, useEffect } from 'react';
import ApiConnection from '../../../core/services/ApiConnection';
import './AgentChat.css';

const api = new ApiConnection();

// Ícones inline para não depender de biblioteca externa
const IconSend = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const IconBot = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    <line x1="12" y1="3" x2="12" y2="7" />
    <circle cx="9" cy="16" r="1" fill="currentColor" />
    <circle cx="15" cy="16" r="1" fill="currentColor" />
  </svg>
);

// Sugestões rápidas exibidas no início
const SUGESTOES_RAPIDAS = [
  'Gastei R$ 50 no Uber',
  'Recebi meu salário de R$ 3500',
  'Quais meus gastos do mês?',
  'Gera um relatório financeiro',
  'Como posso economizar?',
];

export default function AgentChat() {
  const userId = JSON.parse(localStorage.getItem('user') || '{}')?.uid || 'default-user';

  const [mensagens, setMensagens] = useState([
    {
      role: 'agent',
      texto: 'Olá! Sou o **Moneta AI** 💡\nPosso registrar seus gastos e receitas, mostrar relatórios e dar dicas de economia.\n\nComo posso te ajudar hoje?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [carregando, setCarregando] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Histórico formatado para contexto da IA (últimas 10 mensagens)
  const historicoParaIA = mensagens.slice(-10).map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.texto
  }));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, carregando]);

  const enviar = async (texto) => {
    const msg = (texto || input).trim();
    if (!msg || carregando) return;

    setInput('');
    setMensagens(prev => [...prev, { role: 'user', texto: msg, timestamp: new Date() }]);
    setCarregando(true);

    try {
      const res = await api.post('/api/agent/chat', {
        mensagem: msg,
        userId,
        historico: historicoParaIA
      });

      setMensagens(prev => [...prev, {
        role: 'agent',
        texto: res.resposta || 'Não entendi. Pode reformular?',
        acao: res.acao,
        dados: res.dados,
        timestamp: new Date()
      }]);
    } catch {
      setMensagens(prev => [...prev, {
        role: 'agent',
        texto: '⚠️ Erro de conexão. Verifique sua internet e tente novamente.',
        timestamp: new Date()
      }]);
    } finally {
      setCarregando(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  };

  // Renderiza texto com suporte a **negrito** e quebras de linha
  const renderTexto = (texto) => {
    return texto.split('\n').map((linha, i) => {
      const partes = linha.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={i}>
          {partes.map((parte, j) => j % 2 === 1 ? <strong key={j}>{parte}</strong> : parte)}
          {i < texto.split('\n').length - 1 && <br />}
        </span>
      );
    });
  };

  const formatarHora = (date) =>
    date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="agent-chat">
      {/* Header */}
      <div className="agent-chat__header">
        <div className="agent-chat__header-icon">
          <IconBot />
        </div>
        <div>
          <span className="agent-chat__header-title">Moneta AI</span>
          <span className="agent-chat__header-status">Assistente financeiro inteligente</span>
        </div>
      </div>

      {/* Mensagens */}
      <div className="agent-chat__messages">
        {mensagens.map((msg, i) => (
          <div key={i} className={`agent-chat__msg agent-chat__msg--${msg.role}`}>
            {msg.role === 'agent' && (
              <div className="agent-chat__avatar"><IconBot /></div>
            )}
            <div className="agent-chat__bubble">
              <p>{renderTexto(msg.texto)}</p>
              <span className="agent-chat__time">{formatarHora(msg.timestamp)}</span>
            </div>
          </div>
        ))}

        {carregando && (
          <div className="agent-chat__msg agent-chat__msg--agent">
            <div className="agent-chat__avatar"><IconBot /></div>
            <div className="agent-chat__bubble agent-chat__bubble--typing">
              <span /><span /><span />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Sugestões rápidas (só no início) */}
      {mensagens.length <= 1 && (
        <div className="agent-chat__suggestions">
          {SUGESTOES_RAPIDAS.map((s, i) => (
            <button key={i} className="agent-chat__suggestion" onClick={() => enviar(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="agent-chat__input-area">
        <textarea
          ref={inputRef}
          className="agent-chat__input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem... (Enter para enviar)"
          rows={1}
          disabled={carregando}
        />
        <button
          className="agent-chat__send"
          onClick={() => enviar()}
          disabled={!input.trim() || carregando}
          aria-label="Enviar mensagem"
        >
          <IconSend />
        </button>
      </div>
    </div>
  );
}
