const TransactionService = require('../services/TransactionService');
const DatabaseConnection = require('../config/DatabaseConnection');
const TransactionFactory = require('../services/TransactionFactory');

class TransactionController {
  static async create(req, res) {
    try {
      // Singleton Pattern - Conexão única com banco
      const dbConnection = new DatabaseConnection();
      const db = dbConnection.getFirestore();
      
      const transactionData = req.body;
      
      // Factory Method Pattern - Criar transação baseada no tipo
      const transactionType = transactionData.tipo?.toLowerCase() === 'receita' ? 'income' : 'expense';
      const factoryTransaction = TransactionFactory.createTransaction(transactionType, {
        amount: transactionData.valor,
        description: transactionData.descricao,
        category: transactionData.categoria,
        date: transactionData.dataHora
      });
      
      console.log('Factory Backend criou:', factoryTransaction);
      
      const transactionService = new TransactionService();
      const transaction = await transactionService.createTransaction(transactionData);

      res.status(201).json({
        success: true,
        message: 'Transação criada com sucesso!',
        transaction
      });

    } catch (err) {
      console.error('Erro ao criar transação:', err);
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }

  static async getUserTransactions(req, res) {
    try {
      const transactionService = new TransactionService();
      const { userId } = req.params;
      const transactions = await transactionService.getUserTransactions(userId);

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
      const transactionService = new TransactionService();
      const { userId } = req.params;
      const balance = await transactionService.getUserBalance(userId);

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
      const transactionService = new TransactionService();
      const { id } = req.params;
      const updateData = req.body;

      const transaction = await transactionService.updateTransaction(id, updateData);

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
      const transactionService = new TransactionService();
      const { id } = req.params;
      await transactionService.deleteTransaction(id);

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