import { useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useFixedExpenses = (userId = null) => {
  const [loading, setLoading] = useState(false);
  const [fixedExpenses, setFixedExpenses] = useState([]);

  const fetchFixedExpenses = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/fixed-expenses/${userId}`);
      const result = await response.json();
      setFixedExpenses(result.success ? (result.fixedExpenses || []) : []);
    } catch (error) {
      setFixedExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createFixedExpense = async (data) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/fixed-expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...data })
      });
      const result = await response.json();
      if (result.success) await fetchFixedExpenses();
      return result;
    } catch (error) {
      return { success: false, message: 'Erro ao conectar com o servidor' };
    } finally {
      setLoading(false);
    }
  };

  const updateFixedExpense = async (id, data) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/fixed-expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...data })
      });
      const result = await response.json();
      if (result.success) await fetchFixedExpenses();
      return result;
    } catch (error) {
      return { success: false, message: 'Erro ao conectar com o servidor' };
    } finally {
      setLoading(false);
    }
  };

  const deleteFixedExpense = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/fixed-expenses/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const result = await response.json();
      if (result.success) await fetchFixedExpenses();
      return result;
    } catch (error) {
      return { success: false, message: 'Erro ao conectar com o servidor' };
    } finally {
      setLoading(false);
    }
  };

  const lancarFixedExpense = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/fixed-expenses/${id}/lancar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const result = await response.json();
      if (result.success) await fetchFixedExpenses();
      return result;
    } catch (error) {
      return { success: false, message: 'Erro ao conectar com o servidor' };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchFixedExpenses();
  }, [userId, fetchFixedExpenses]);

  return {
    loading,
    fixedExpenses,
    fetchFixedExpenses,
    createFixedExpense,
    updateFixedExpense,
    deleteFixedExpense,
    lancarFixedExpense
  };
};
