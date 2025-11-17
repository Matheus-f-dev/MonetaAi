import { useState, useEffect } from 'react';
import observerService from '../../core/services/ObserverService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Hook integrado com Observer Pattern
export function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.uid || 'default-user';
      
      const response = await fetch(`${API_URL}/api/transactions/${userId}`);
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
  
  // Método para notificar observers sobre nova transação
  const notifyNewTransaction = (transactionData) => {
    observerService.notify(transactionData);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return {
    transactions,
    loading,
    refreshTransactions: fetchTransactions,
    notifyNewTransaction
  };
}

