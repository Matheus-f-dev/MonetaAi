// Service Layer - Observer Pattern
import { useToast } from '../../presentation/hooks/useToast.js';

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
        const { addToast } = useToast();
        addToast(`⚠️ Gasto Alto Detectado! ${transaction.descricao} - R$ ${valor.toFixed(2)} [${transaction.categoria}]`, 'warning');
      }, 100);
    }
  }
}

class ActivityLogObserver {
  update(transaction) {
    const valor = Math.abs(transaction.valor || 0);
    const tipo = transaction.tipo?.toLowerCase() === 'receita' ? 'Receita' : 'Despesa';
    

    
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