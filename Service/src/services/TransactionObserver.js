class TransactionSubject {
    constructor() {
        this.observers = [];
    }
    
    subscribe(observer) {
        this.observers.push(observer);
    }
    
    unsubscribe(observer) {
        this.observers = this.observers.filter(obs => obs !== observer);
    }
    
    notify(transaction) {
        this.observers.forEach(obs => obs.update(transaction));
    }
}

class EmailNotifier {
    update(transaction) {
        console.log(`Email: Nova transação de ${transaction.type}: R$ ${transaction.amount}`);
    }
}

class AlertNotifier {
    update(transaction) {
        if (transaction.type === 'expense' && Math.abs(transaction.amount) > 1000) {
            console.log(`Alerta: Gasto alto detectado: R$ ${Math.abs(transaction.amount)}`);
        }
    }
}

class LogNotifier {
    update(transaction) {
        console.log(`Log: ${new Date().toISOString()} - ${transaction.type}: ${transaction.description}`);
    }
}

module.exports = { TransactionSubject, EmailNotifier, AlertNotifier, LogNotifier };