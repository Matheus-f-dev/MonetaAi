import { useState, useEffect } from 'react';
import ApiConnection from '../../core/services/ApiConnection';

export const useTransactionData = (userId) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTransactions = async (filters = {}) => {
    if (!userId) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Singleton Pattern - Conexão única com API
      const apiConnection = new ApiConnection();
      
      // Construir query string com filtros
      const queryParams = new URLSearchParams();
      if (filters.filter) queryParams.append('filter', filters.filter);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.type) queryParams.append('type', filters.type);
      
      const queryString = queryParams.toString();
      const url = `/api/transactions/${userId}${queryString ? `?${queryString}` : ''}`;
      
      const data = await apiConnection.get(url);
      
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

  const fetchChartData = async (filter = 'month') => {
    if (!userId) return null;
    
    try {
      const apiConnection = new ApiConnection();
      const data = await apiConnection.get(`/api/chart-data/${userId}?filter=${filter}`);
      
      if (data.success) {
        return data.chartData;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar dados do gráfico:', error);
      return null;
    }
  };
  
  return {
    transactions,
    loading,
    error,
    fetchTransactions,
    createTransaction,
    fetchChartData
  };
};