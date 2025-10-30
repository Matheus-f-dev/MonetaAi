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
      const userId = req.params.userId || req.user?.id || 'default';
      
      // Use transactions from request body if provided, otherwise fetch from database
      let transactions = req.body.transactions;
      if (!transactions) {
        transactions = await TransactionService.obterTransacoesPorUsuario(userId);
      }
      
      if (!transactions || transactions.length === 0) {
        const emptyProjection = Array.from({length: periodo}, (_, i) => ({ month: i, balance: 0 }));
        return res.json({
          saldoAtual: 0,
          tendencia: 'estável',
          cenarios: {
            optimistic: emptyProjection,
            realistic: emptyProjection,
            pessimistic: emptyProjection
          }
        });
      }
      
      const saldoAtual = ProjectionService.getCurrentBalance(transactions);
      
      // Create realistic projection
      const realisticProjection = Array.from({length: periodo}, (_, i) => ({ 
        month: i, 
        balance: saldoAtual + (i * 100) // Simple simulation
      }));
      
      // Create optimistic projection (20% better)
      const optimisticProjection = Array.from({length: periodo}, (_, i) => ({ 
        month: i, 
        balance: saldoAtual + (i * 120)
      }));
      
      // Create pessimistic projection (20% worse)
      const pessimisticProjection = Array.from({length: periodo}, (_, i) => ({ 
        month: i, 
        balance: saldoAtual + (i * 80)
      }));
      
      // Determine trend
      const finalBalance = realisticProjection[realisticProjection.length - 1]?.balance || saldoAtual;
      let tendencia = 'estável';
      if (finalBalance > saldoAtual * 1.05) tendencia = 'crescendo';
      else if (finalBalance < saldoAtual * 0.95) tendencia = 'decaindo';
      
      res.json({
        saldoAtual,
        tendencia,
        cenarios: {
          optimistic: optimisticProjection,
          realistic: realisticProjection,
          pessimistic: pessimisticProjection
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ProjecaoSaldoController;