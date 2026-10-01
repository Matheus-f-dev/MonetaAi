import ApiConnection from '../../core/services/ApiConnection';

/**
 * Fase 7 -- reconstrução de /agent dentro do AppShell. Mesmo contrato de
 * backend do widget antigo (AgentChat.jsx): um único POST por mensagem,
 * sem streaming, o histórico vai junto a cada chamada porque o backend
 * não guarda sessão de conversa nenhuma entre requests.
 */
export interface AgentHistoryEntry {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentReply {
  resposta?: string;
  acao?: string;
  dados?: unknown;
}

export async function sendAgentMessage(
  userId: string,
  mensagem: string,
  historico: AgentHistoryEntry[]
): Promise<AgentReply> {
  const api = new ApiConnection();
  return api.post('/api/agent/chat', { mensagem, userId, historico });
}
