const TransactionService = require('../services/TransactionService');

class TransactionViewController {
  constructor() {
    this.transactionService = new TransactionService();
  }

  async getTransactions(req, res) {
    try {
      const { userId } = req.params;
      const result = await this.transactionService.getTransactions(userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  async createTransaction(req, res) {
    try {
      const result = await this.transactionService.createTransaction(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }

  async getFilteredTransactions(req, res) {
    try {
      const { userId } = req.params;
      const { tipo, periodo } = req.query;
      const result = await this.transactionService.getFilteredTransactions(userId, tipo, periodo);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  }
}

module.exports = TransactionViewController;