const TransactionService = require('../services/TransactionService');
const ProjectionService = require('../services/ProjectionService');

class ProjecaoSaldoController {
  static async obterProjecaoSaldo(req, res) {
    try {
      const userId = req.user?.id || 'default';
      const transacoes = await TransactionService.obterTransacoesPorUsuario(userId);
      const saldoAtual = ProjectionService.getCurrentBalance(transacoes);

      res.json({ saldoAtual });
    } catch (error) {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async calcularProjecao(req, res) {
    try {
      const { meses } = req.params;
      const periodo = parseInt(meses) || 12;
      const { transactions } = req.body;
      
      if (!transactions || transactions.length === 0) {
        return res.json({
          saldoAtual: 0,
          cenarios: { optimistic: [{ month: 0, balance: 0 }], realistic: [{ month: 0, balance: 0 }], pessimistic: [{ month: 0, balance: 0 }] },
          tendencia: 'estável',
          saldoFinal: 0,
          variacao: 0
        });
      }
      
      const resultado = ProjectionService.calculateAdvancedProjection(transactions, periodo);
      
      res.json({
        saldoAtual: resultado.currentBalance,
        cenarios: resultado.scenarios,
        tendencia: resultado.trend,
        saldoFinal: resultado.scenarios.realistic[resultado.scenarios.realistic.length - 1]?.balance || resultado.currentBalance,
        variacao: (resultado.scenarios.realistic[resultado.scenarios.realistic.length - 1]?.balance || resultado.currentBalance) - resultado.currentBalance
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ProjecaoSaldoController;