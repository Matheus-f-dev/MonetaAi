import { useState, useEffect } from 'react';

// Observer Pattern
class TransactionSubject {
  constructor() {
    this.observers = [];
  }
  
  subscribe(observer) {
    this.observers.push(observer);
  }
  
  notify(transaction) {
    this.observers.forEach(obs => obs.update(transaction));
  }
}

class NotificationObserver {
  update(transaction) {
    console.log(`Nova transação: ${transaction.type} - R$ ${Math.abs(transaction.amount)}`);
    
    // Notificação para gastos altos
    if (transaction.type === 'expense' && Math.abs(transaction.amount) > 500) {
      alert(`Atenção: Gasto alto de R$ ${Math.abs(transaction.amount)} detectado!`);
    }
  }
}

const transactionSubject = new TransactionSubject();
const notificationObserver = new NotificationObserver();
transactionSubject.subscribe(notificationObserver);

export function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.uid || 'default-user';
      
      const response = await fetch(`http://localhost:3000/api/transactions/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const addTransaction = (transactionData) => {
    // Observer - notificar sobre nova transação
    transactionSubject.notify(transactionData);
    
    // Adicionar à lista local
    setTransactions(prev => [...prev, transactionData]);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return {
    transactions,
    loading,
    refreshTransactions: fetchTransactions,
    addTransaction
  };
}