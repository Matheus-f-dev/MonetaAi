const Transaction = require('../models/Transaction');
const TransactionRepository = require('../repositories/TransactionRepository');

class TransactionService {
  constructor() {
    this.repository = new TransactionRepository();
  }

  async createTransaction(transactionData) {
    try {
      const transaction = new Transaction(transactionData);
      const savedData = await this.repository.create(transaction.userId, transaction.toPersistence());
      return Transaction.fromRepository({ ...savedData, userId: transaction.userId });
    } catch (error) {
      throw new Error(`Erro ao criar transação: ${error.message}`);
    }
  }

  async getUserTransactions(userId) {
    if (!userId) throw new Error('UserId é obrigatório');
    const data = await this.repository.findByUserId(userId);
    return data.map(item => Transaction.fromRepository(item));
  }

  async getTransactionById(userId, transactionId) {
    const data = await this.repository.findById(userId, transactionId);
    return data ? Transaction.fromRepository(data) : null;
  }

  // Métodos de compatibilidade para manter funcionamento
  async updateTransaction(id, updateData) {
    // Busca a transação primeiro para obter o userId
    const allUsers = await this.repository.findByUserId('default-user'); // Simplificação
    throw new Error('Método precisa ser atualizado para incluir userId');
  }

  async deleteTransaction(id) {
    throw new Error('Método precisa ser atualizado para incluir userId');
  }

  async updateTransaction(userId, transactionId, updateData) {
    const updatedData = await this.repository.update(userId, transactionId, updateData);
    return Transaction.fromRepository(updatedData);
  }

  async deleteTransaction(userId, transactionId) {
    await this.repository.delete(userId, transactionId);
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