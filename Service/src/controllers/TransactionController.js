const TransactionService = require('../services/TransactionService');

class TransactionController {
  static async create(req, res) {
    try {
      const transactionData = req.body;
      const transaction = await TransactionService.createTransaction(transactionData);

      res.status(201).json({
        success: true,
        message: 'Transação criada com sucesso!',
        transaction
      });

    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }

  static async getUserTransactions(req, res) {
    try {
      const { userId } = req.params;
      const transactions = await TransactionService.getUserTransactions(userId);

      res.json({
        success: true,
        transactions
      });

    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar transações'
      });
    }
  }

  static async getUserBalance(req, res) {
    try {
      const { userId } = req.params;
      const balance = await TransactionService.getUserBalance(userId);

      res.json({
        success: true,
        balance
      });

    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Erro ao calcular saldo'
      });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const transaction = await TransactionService.updateTransaction(id, updateData);

      res.json({
        success: true,
        message: 'Transação atualizada com sucesso!',
        transaction
      });

    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message || 'Erro ao atualizar transação'
      });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      await TransactionService.deleteTransaction(id);

      res.json({
        success: true,
        message: 'Transação excluída com sucesso!'
      });

    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message || 'Erro ao excluir transação'
      });
    }
  }
}

module.exports = TransactionController;