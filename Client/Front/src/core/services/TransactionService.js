import { Transaction } from '../../domain/Transaction';

export class TransactionService {
  constructor() {
    this.baseUrl = 'http://localhost:3000/api/transactions';
  }

  async getUserTransactions(userId) {
    try {
      const response = await fetch(`${this.baseUrl}/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        return data.transactions.map(t => new Transaction(t));
      }
      throw new Error(data.message || 'Erro ao buscar transações');
    } catch (error) {
      throw new Error(`Erro ao buscar transações: ${error.message}`);
    }
  }

  async createTransaction(transactionData) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        return new Transaction(result.transaction);
      }
      throw new Error(result.message || 'Erro ao criar transação');
    } catch (error) {
      throw new Error(`Erro ao criar transação: ${error.message}`);
    }
  }

  calculateBalance(transactions) {
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

  getRecentTransactions(transactions, limit = 5) {
    return transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  }

  filterByType(transactions, type) {
    return transactions.filter(t => 
      type === 'receita' ? t.isReceita() : t.isDespesa()
    );
  }

  filterByPeriod(transactions, period) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      
      switch (period) {
        case 'este-mes':
          return transactionDate.getMonth() === currentMonth && 
                 transactionDate.getFullYear() === currentYear;
        case 'mes-passado':
          const lastMonth = currentMonth - 1;
          const year = lastMonth < 0 ? currentYear - 1 : currentYear;
          const month = lastMonth < 0 ? 11 : lastMonth;
          return transactionDate.getMonth() === month && 
                 transactionDate.getFullYear() === year;
        default:
          return true;
      }
    });
  }
}