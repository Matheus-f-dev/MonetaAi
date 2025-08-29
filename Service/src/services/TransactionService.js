const Transaction = require('../models/Transaction');

class TransactionService {
  static async createTransaction(transactionData) {
    return await Transaction.create(transactionData);
  }

  static async getUserTransactions(userId) {
    return await Transaction.findByUserId(userId);
  }

  static async getTransactionById(id) {
    return await Transaction.findById(id);
  }

  static async updateTransaction(id, updateData) {
    const transaction = await Transaction.findById(id);
    if (!transaction) throw new Error('Transação não encontrada');
    return await transaction.update(updateData);
  }

  static async deleteTransaction(id) {
    const transaction = await Transaction.findById(id);
    if (!transaction) throw new Error('Transação não encontrada');
    await transaction.delete();
  }

  static async getUserBalance(userId) {
    const transactions = await Transaction.findByUserId(userId);
    
    const receitas = transactions
      .filter(t => t.tipo === 'receita')
      .reduce((sum, t) => sum + t.valor, 0);
    
    const despesas = transactions
      .filter(t => t.tipo === 'despesa')
      .reduce((sum, t) => sum + t.valor, 0);
    
    return {
      receitas,
      despesas,
      saldo: receitas - despesas
    };
  }
}

module.exports = TransactionService;