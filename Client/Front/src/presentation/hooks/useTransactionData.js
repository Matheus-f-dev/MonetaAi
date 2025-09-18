import { useState, useEffect } from 'react';

export const useTransactionData = (userId) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTransactions = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`http://localhost:3000/api/transactions/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.transactions);
      } else {
        setError(data.message || 'Erro ao buscar transações');
      }
    } catch (error) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async (transactionData) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchTransactions(); // Recarregar dados
      } else {
        setError(result.message || 'Erro ao criar transação');
      }
      
      return result;
    } catch (error) {
      const errorMsg = 'Erro ao conectar com o servidor';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [userId]);

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
    createTransaction
  };
};