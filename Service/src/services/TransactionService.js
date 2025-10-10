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

  async getUserTransactions(userId, filters = {}) {
    if (!userId) throw new Error('UserId é obrigatório');
    const data = await this.repository.findByUserId(userId);
    let transactions = data.map(item => Transaction.fromRepository(item));
    
    // Aplicar filtros no backend
    if (filters.filter) {
      transactions = this.applyDateFilter(transactions, filters.filter);
    }
    
    if (filters.startDate && filters.endDate) {
      transactions = this.applyDateRangeFilter(transactions, filters.startDate, filters.endDate);
    }
    
    if (filters.category) {
      transactions = transactions.filter(t => t.categoria === filters.category);
    }
    
    if (filters.type) {
      transactions = transactions.filter(t => t.tipo?.toLowerCase() === filters.type.toLowerCase());
    }
    
    return transactions;
  }
  
  applyDateFilter(transactions, filter) {
    const now = new Date();
    let filterDate;
    
    switch (filter) {
      case 'week':
        filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        filterDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'year':
        filterDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return transactions;
    }
    
    return transactions.filter(transaction => {
      const dateField = transaction.dataHora || transaction.data || transaction.criadoEm;
      if (!dateField) return false;
      
      let transactionDate;
      if (typeof dateField === 'string' && dateField.includes('/')) {
        const [datePart] = dateField.split(', ');
        const [day, month, year] = datePart.split('/');
        transactionDate = new Date(year, month - 1, day);
      } else {
        transactionDate = new Date(dateField);
      }
      
      return transactionDate >= filterDate;
    });
  }
  
  applyDateRangeFilter(transactions, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return transactions.filter(transaction => {
      const dateField = transaction.dataHora || transaction.data || transaction.criadoEm;
      if (!dateField) return false;
      
      let transactionDate;
      if (typeof dateField === 'string' && dateField.includes('/')) {
        const [datePart] = dateField.split(', ');
        const [day, month, year] = datePart.split('/');
        transactionDate = new Date(year, month - 1, day);
      } else {
        transactionDate = new Date(dateField);
      }
      
      return transactionDate >= start && transactionDate <= end;
    });
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

  async getUserBalance(userId, filters = {}) {
    const transactions = await this.getUserTransactions(userId, filters);
    
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

  async getChartData(userId, filter = 'month') {
    const transactions = await this.getUserTransactions(userId, { filter });
    
    const groupedByDate = {};
    
    transactions.forEach(transaction => {
      const dateField = transaction.dataHora || transaction.data || transaction.criadoEm;
      let date;
      
      if (dateField && typeof dateField === 'string' && dateField.includes('/')) {
        const [datePart] = dateField.split(', ');
        date = datePart;
      } else {
        date = new Date().toLocaleDateString('pt-BR');
      }
      
      if (!groupedByDate[date]) {
        groupedByDate[date] = { receitas: 0, despesas: 0 };
      }
      
      const valor = Math.abs(transaction.valor || 0);
      if (transaction.tipo?.toLowerCase() === 'receita') {
        groupedByDate[date].receitas += valor;
      } else {
        groupedByDate[date].despesas += valor;
      }
    });
    
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
      const [dayA, monthA, yearA] = a.split('/');
      const [dayB, monthB, yearB] = b.split('/');
      return new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB);
    });
    
    let receitasAcumuladas = 0;
    let despesasAcumuladas = 0;
    
    const receitasData = sortedDates.map(date => {
      receitasAcumuladas += groupedByDate[date].receitas;
      return receitasAcumuladas;
    });
    
    const despesasData = sortedDates.map(date => {
      despesasAcumuladas += groupedByDate[date].despesas;
      return despesasAcumuladas;
    });
    
    return {
      labels: sortedDates,
      datasets: [
        {
          label: 'Receitas Acumuladas',
          data: receitasData,
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22, 163, 74, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Despesas Acumuladas',
          data: despesasData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
        }
      ],
    };
  }
  
  async getPercentageChange(userId, period) {
    const currentFilters = this.getPeriodFilters(period);
    const previousFilters = this.getPreviousPeriodFilters(period);
    
    const currentTransactions = await this.getUserTransactions(userId, currentFilters);
    const previousTransactions = await this.getUserTransactions(userId, previousFilters);
    
    const currentIncome = currentTransactions.filter(t => t.tipo?.toLowerCase() === 'receita').reduce((sum, t) => sum + Math.abs(t.valor || 0), 0);
    const currentExpenses = currentTransactions.filter(t => t.tipo?.toLowerCase() === 'despesa').reduce((sum, t) => sum + Math.abs(t.valor || 0), 0);
    const currentBalance = currentIncome - currentExpenses;
    
    const prevIncome = previousTransactions.filter(t => t.tipo?.toLowerCase() === 'receita').reduce((sum, t) => sum + Math.abs(t.valor || 0), 0);
    const prevExpenses = previousTransactions.filter(t => t.tipo?.toLowerCase() === 'despesa').reduce((sum, t) => sum + Math.abs(t.valor || 0), 0);
    const prevBalance = prevIncome - prevExpenses;
    
    const calculatePercentage = (current, previous) => {
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const change = ((current - previous) / previous) * 100;
      return change >= 0 ? `+${change.toFixed(0)}%` : `${change.toFixed(0)}%`;
    };
    
    return {
      income: calculatePercentage(currentIncome, prevIncome),
      expenses: calculatePercentage(currentExpenses, prevExpenses),
      balance: calculatePercentage(currentBalance, prevBalance)
    };
  }
  
  getPeriodFilters(period) {
    const now = new Date();
    switch (period) {
      case 'Este Mês':
        return {
          startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
          endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
        };
      case 'Últimos 3 Meses':
        return {
          startDate: new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0],
          endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
        };
      case 'Este Ano':
        return {
          startDate: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
          endDate: new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0]
        };
      default:
        return {};
    }
  }
  
  getPreviousPeriodFilters(period) {
    const now = new Date();
    switch (period) {
      case 'Este Mês':
        return {
          startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0],
          endDate: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
        };
      case 'Últimos 3 Meses':
        return {
          startDate: new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0],
          endDate: new Date(now.getFullYear(), now.getMonth() - 3, 0).toISOString().split('T')[0]
        };
      case 'Este Ano':
        return {
          startDate: new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0],
          endDate: new Date(now.getFullYear() - 1, 11, 31).toISOString().split('T')[0]
        };
      default:
        return {};
    }
  }
  
  static async obterTransacoesPorUsuario(userId) {
    const service = new TransactionService();
    const transactions = await service.getUserTransactions(userId);
    return transactions.map(t => ({
      tipo: t.tipo,
      valor: t.valor,
      categoria: t.categoria,
      descricao: t.descricao,
      dataHora: t.dataHora
    }));
  }
}

module.exports = TransactionService;