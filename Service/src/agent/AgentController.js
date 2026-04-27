/**
 * AgentController — Endpoint HTTP do agente Moneta AI.
 *
 * POST /api/agent/chat
 * Body: { mensagem: string, userId: string, historico?: Array }
 *
 * Response: { sucesso: true, acao: string, resposta: string, dados: object }
 */

const AgentService = require('./AgentService');

const agentService = new AgentService();

class AgentController {
  static async chat(req, res) {
    try {
      const { mensagem, userId, historico = [] } = req.body;

      if (!mensagem?.trim()) {
        return res.status(400).json({ sucesso: false, resposta: 'Mensagem não pode ser vazia.' });
      }

      if (!userId) {
        return res.status(400).json({ sucesso: false, resposta: 'userId é obrigatório.' });
      }

      const resultado = await agentService.processar(mensagem.trim(), userId, historico);

      res.json({
        sucesso: true,
        acao: resultado.acao,
        resposta: resultado.resposta,
        dados: resultado.dados || null
      });

    } catch (error) {
      console.error('[AgentController] Erro:', error.message);
      res.status(500).json({
        sucesso: false,
        resposta: 'Ocorreu um erro interno. Tente novamente em instantes.',
        dados: null
      });
    }
  }
}

module.exports = AgentController;
