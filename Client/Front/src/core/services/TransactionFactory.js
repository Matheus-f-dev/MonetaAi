// Factory Method Pattern - Frontend
class TransactionFactory {
  static createTransaction(tipo, data) {
    switch(tipo?.toLowerCase()) {
      case 'receita':
        return new IncomeTransaction(data);
      case 'despesa':
        return new ExpenseTransaction(data);
      default:
        throw new Error(`Tipo de transação inválido: ${tipo}`);
    }
  }
}

class IncomeTransaction {
  constructor(data) {
    this.tipo = 'Receita';
    this.valor = Math.abs(parseFloat(data.valor));
    this.descricao = data.descricao;
    this.categoria = data.categoria;
    this.data = data.data;
    this.userId = data.userId;
  }
}

class ExpenseTransaction {
  constructor(data) {
    this.tipo = 'Despesa';
    this.valor = -Math.abs(parseFloat(data.valor));
    this.descricao = data.descricao;
    this.categoria = data.categoria;
    this.data = data.data;
    this.userId = data.userId;
  }
}

export { TransactionFactory, IncomeTransaction, ExpenseTransaction };