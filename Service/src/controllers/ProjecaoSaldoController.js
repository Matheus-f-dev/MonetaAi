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
      const userId = req.user?.id || 'default';
      
      const transactions = await TransactionService.obterTransacoesPorUsuario(userId);
      
      if (!transactions || transactions.length === 0) {
        return res.json({
          saldoAtual: 0,
          projecao: Array.from({length: periodo}, (_, i) => ({ mes: i + 1, saldo: 0 })),
          saldoFinal: 0,
          variacao: 0
        });
      }
      
      const saldoAtual = ProjectionService.getCurrentBalance(transactions);
      const projecao = Array.from({length: periodo}, (_, i) => ({ 
        mes: i + 1, 
        saldo: saldoAtual + (i * 100) // Simulação simples
      }));
      
      res.json({
        saldoAtual,
        projecao,
        saldoFinal: projecao[projecao.length - 1]?.saldo || saldoAtual,
        variacao: (projecao[projecao.length - 1]?.saldo || saldoAtual) - saldoAtual
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ProjecaoSaldoController;