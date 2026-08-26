// Service Layer - Observer Pattern
import { useToast } from '../../presentation/hooks/useToast.js';
import { getAuthHeaders } from '../../shared/authHeaders';

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
  constructor() {
    this.alerts = [];
    this.loadAlerts();
  }
  
  async loadAlerts() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.uid;
      
      if (!userId) return;
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/alerts/${userId}`, { headers: getAuthHeaders() });
      const data = await response.json();
      
      if (data.success) {
        this.alerts = data.alerts || [];
      }
    } catch (error) {
      // Erro silencioso
    }
  }
  
  async update(transaction) {
    if (transaction.tipo?.toLowerCase() !== 'despesa') return;
    
    const valor = Math.abs(transaction.valor || 0);
    const categoria = transaction.categoria;
    
    // Recarregar alertas se necessário
    if (this.alerts.length === 0) {
      await this.loadAlerts();
    }
    
    // Verificar alertas personalizados
    const categoryAlerts = this.alerts.filter(alert => 
      alert.categoria === categoria && alert.ativo
    );
    
    if (categoryAlerts.length > 0) {
      // Buscar total de gastos da categoria no mês
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user.uid;
        
        const now = new Date();
        const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const endOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`;
        
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/transactions/${userId}?startDate=${startOfMonth}&endDate=${endOfMonth}&category=${categoria}&type=despesa`, { headers: getAuthHeaders() });
        const data = await response.json();
        
        if (data.success) {
          const totalGastos = data.transactions.reduce((sum, t) => sum + Math.abs(t.valor), 0);
          
          categoryAlerts.forEach(alert => {
            let alertTriggered = false;
            
            switch (alert.condicao) {
              case 'Maior que':
                alertTriggered = totalGastos > alert.valor;
                break;
              case 'Menor que':
                alertTriggered = totalGastos < alert.valor;
                break;
              case 'Igual a':
                alertTriggered = totalGastos === alert.valor;
                break;
            }
            
            if (alertTriggered) {
              setTimeout(() => {
                const { addToast } = useToast();
                addToast(`🚨 ${alert.nome}: ${categoria} ${alert.condicao.toLowerCase()} R$ ${alert.valor}. Total atual: R$ ${totalGastos.toFixed(2)}`, 'warning');
              }, 100);
            }
          });
        }
      } catch (error) {
        // Erro silencioso
      }
    } else if (valor > 1000) {
      // Fallback para gasto alto genérico
      setTimeout(() => {
        const { addToast } = useToast();
        addToast(`⚠️ Gasto Alto Detectado! ${transaction.descricao} - R$ ${valor.toFixed(2)} [${transaction.categoria}]`, 'warning');
      }, 100);
    }
  }
}

class ActivityLogObserver {
  constructor() {
    this.processedTransactions = new Set();
  }
  
  update(transaction) {
    const valor = Math.abs(transaction.valor || 0);
    const tipo = transaction.tipo?.toLowerCase() === 'receita' ? 'Receita' : 'Despesa';
    const transactionId = `${transaction.userId}-${transaction.descricao}-${valor}-${transaction.dataHora}`;
    
    // Evitar processar a mesma transação duas vezes
    if (this.processedTransactions.has(transactionId)) {
      return;
    }
    
    this.processedTransactions.add(transactionId);
    
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
  constructor() {
    this.processedTransactions = new Set();
  }
  
  update(transaction) {
    const valor = Math.abs(transaction.valor || 0);
    const transactionId = `${transaction.userId}-${transaction.descricao}-${valor}-${transaction.dataHora}`;
    
    // Evitar processar a mesma transação duas vezes
    if (this.processedTransactions.has(transactionId)) {
      return;
    }
    
    this.processedTransactions.add(transactionId);
    
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