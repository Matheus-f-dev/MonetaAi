const TransactionService = require('../services/TransactionService');
const DatabaseConnection = require('../config/DatabaseConnection');
const TransactionFactory = require('../services/TransactionFactory');
const { TransactionSubject } = require('../services/TransactionObserver');

const transactionSubject = new TransactionSubject();

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
      

      
      const transactionService = new TransactionService();
      const transaction = await transactionService.createTransaction(transactionData);
      
      // Notificar observers sobre a nova transação
      transactionSubject.notify(transactionData);

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
      const transactionService = new TransactionService();
      const { userId } = req.params;
      const { filter, startDate, endDate, category, type } = req.query;
      
      const transactions = await transactionService.getUserTransactions(userId, {
        filter,
        startDate,
        endDate,
        category,
        type
      });

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
      const { filter, startDate, endDate, category, type } = req.query;
      
      const balance = await transactionService.getUserBalance(userId, {
        filter,
        startDate,
        endDate,
        category,
        type
      });

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
  
  static async getChartData(req, res) {
    try {
      const transactionService = new TransactionService();
      const { userId } = req.params;
      const { filter } = req.query;
      
      const chartData = await transactionService.getChartData(userId, filter);

      res.json({
        success: true,
        chartData
      });

    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Erro ao gerar dados do gráfico'
      });
    }
  }
  
  static async getPercentageChange(req, res) {
    try {
      const transactionService = new TransactionService();
      const { userId } = req.params;
      const { period } = req.query;
      
      const percentageChange = await transactionService.getPercentageChange(userId, period);

      res.json({
        success: true,
        percentageChange
      });

    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Erro ao calcular porcentagens'
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