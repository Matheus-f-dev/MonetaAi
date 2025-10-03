// Service Layer - Observer Pattern
class TransactionObserverService {
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

// Observers específicos
class HighExpenseObserver {
  update(transaction) {
    const valor = Math.abs(transaction.valor || 0);
    
    if (transaction.tipo?.toLowerCase() === 'despesa' && valor > 500) {
      setTimeout(() => {
        alert(`⚠️ Gasto Alto Detectado!\n\nDescrição: ${transaction.descricao}\nValor: R$ ${valor.toFixed(2)}\nCategoria: ${transaction.categoria}`);
      }, 100);
    }
  }
}

class ActivityLogObserver {
  update(transaction) {
    const valor = Math.abs(transaction.valor || 0);
    const tipo = transaction.tipo?.toLowerCase() === 'receita' ? 'Receita' : 'Despesa';
    
    console.log(`📊 Nova ${tipo}: ${transaction.descricao} - R$ ${valor.toFixed(2)} [${transaction.categoria}]`);
    
    const activities = JSON.parse(localStorage.getItem('activityLog') || '[]');
    activities.unshift({
      id: Date.now(),
      timestamp: new Date().toLocaleString('pt-BR'),
      action: `${tipo} adicionada`,
      description: `${transaction.descricao} - R$ ${valor.toFixed(2)}`,
      category: transaction.categoria
    });
    
    localStorage.setItem('activityLog', JSON.stringify(activities.slice(0, 50)));
  }
}

class PatternAnalysisObserver {
  update(transaction) {
    const valor = Math.abs(transaction.valor || 0);
    
    if (transaction.tipo?.toLowerCase() === 'despesa') {
      const categorySpending = JSON.parse(localStorage.getItem('categorySpending') || '{}');
      const categoria = transaction.categoria || 'Outros';
      
      categorySpending[categoria] = (categorySpending[categoria] || 0) + valor;
      localStorage.setItem('categorySpending', JSON.stringify(categorySpending));
      
      if (categorySpending[categoria] > 1000) {
        console.warn(`💰 Categoria '${categoria}' já ultrapassou R$ 1000 este mês!`);
      }
    }
  }
}

// Instância singleton do serviço
const observerService = new TransactionObserverService();

// Registrar observers
observerService.subscribe(new HighExpenseObserver());
observerService.subscribe(new ActivityLogObserver());
observerService.subscribe(new PatternAnalysisObserver());

export default observerService;