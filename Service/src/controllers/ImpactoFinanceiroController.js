const ImpactoFinanceiroService = require('../services/ImpactoFinanceiroService');

class ImpactoFinanceiroController {
  static async calcularImpacto(req, res) {
    try {
      const { userId, produto, valor } = req.body;

      if (!userId || !produto || !valor) {
        return res.status(400).json({
          success: false,
          message: 'UserId, produto e valor são obrigatórios'
        });
      }

      const valorNum = parseFloat(valor);
      if (isNaN(valorNum) || valorNum <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valor deve ser um número positivo'
        });
      }

      const analise = await ImpactoFinanceiroService.analisarImpacto(userId, produto, valorNum);

      res.json({
        success: true,
        analise
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = ImpactoFinanceiroController;