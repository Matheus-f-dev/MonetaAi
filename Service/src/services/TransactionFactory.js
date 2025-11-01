class TransactionFactory {
    static createTransaction(type, data) {
        switch(type) {
            case 'income':
                return new IncomeTransaction(data);
            case 'expense':
                return new ExpenseTransaction(data);
            case 'transfer':
                return new TransferTransaction(data);
            default:
                throw new Error(`Tipo de transação inválido: ${type}`);
        }
    }
}

class IncomeTransaction {
    constructor(data) {
        this.type = 'income';
        this.amount = Math.abs(data.amount);
        this.description = data.description;
        this.category = data.category;
        this.date = data.date;
    }
}

class ExpenseTransaction {
    constructor(data) {
        this.type = 'expense';
        this.amount = -Math.abs(data.amount);
        this.description = data.description;
        this.category = data.category;
        this.date = data.date;
    }
}

class TransferTransaction {
    constructor(data) {
        this.type = 'transfer';
        this.amount = data.amount;
        this.fromAccount = data.fromAccount;
        this.toAccount = data.toAccount;
        this.description = data.description;
        this.date = data.date;
    }
}

module.exports = TransactionFactory;