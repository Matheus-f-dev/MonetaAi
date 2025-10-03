import { useState, useEffect } from 'react';
import ApiConnection from '../../core/services/ApiConnection';

export const useTransactionData = (userId) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTransactions = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Singleton Pattern - Conexão única com API
      const apiConnection = new ApiConnection();
      const data = await apiConnection.get(`/api/transactions/${userId}`);
      
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
      // Singleton Pattern - Conexão única com API
      const apiConnection = new ApiConnection();
      const result = await apiConnection.post('/api/transactions', transactionData);
      
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