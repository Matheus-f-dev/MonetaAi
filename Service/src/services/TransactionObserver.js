const AlertObserver = require('./AlertObserver');

class TransactionSubject {
    constructor() {
        this.observers = [];
        this.setupDefaultObservers();
    }
    
    setupDefaultObservers() {
        this.subscribe(new AlertObserver());
        this.subscribe(new LogNotifier());
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

// EmailNotifier e AlertNotifier existiam aqui como stubs nunca conectados
// em setupDefaultObservers() (só faziam console.log, e usando nomes de
// campo que nem existem no objeto real de transação -- type/amount em vez
// de tipo/valor). O envio de e-mail de verdade quando um alerta dispara
// agora mora em AlertObserver.triggerAlert(), que já tem os dados corretos
// do alerta (categoria/condicao/limite) -- não dava pra fazer isso aqui,
// que só recebe a transação crua.

class LogNotifier {
    update(transaction) {
        console.log(`Log: ${new Date().toISOString()} - ${transaction.tipo}: ${transaction.descricao}`);
    }
}

module.exports = { TransactionSubject, LogNotifier };