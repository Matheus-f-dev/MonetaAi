const Transaction = require('../models/Transaction');
const BaseService = require('./BaseService');

class TransactionService extends BaseService {
  constructor() {
    super(Transaction);
  }
  async createTransaction(transactionData) {
    try {
      return await this.create(transactionData);
    } catch (error) {
      throw new Error(`Erro ao criar transação: ${error.message}`);
    }
  }

  async getUserTransactions(userId) {
    if (!userId) throw new Error('UserId é obrigatório');
    return await Transaction.findByUserId(userId);
  }

  async getTransactionById(id) {
    return await this.findById(id);
  }

  async updateTransaction(id, updateData) {
    return await this.update(id, updateData);
  }

  async deleteTransaction(id) {
    return await this.delete(id);
  }

  async getUserBalance(userId) {
    const transactions = await this.getUserTransactions(userId);
    
    const receitas = transactions
      .filter(t => t.isReceita())
      .reduce((sum, t) => sum + t.valor, 0);
    
    const despesas = transactions
      .filter(t => t.isDespesa())
      .reduce((sum, t) => sum + t.valor, 0);
    
    return {
      receitas,
      despesas,
      saldo: receitas - despesas
    };
  }
}

module.exports = TransactionService;