import { useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useAccounts = (userId = null) => {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [resumo, setResumo] = useState(null);

  const fetchAccounts = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/accounts/${userId}`);
      const result = await response.json();
      setAccounts(result.success ? (result.accounts || []) : []);
    } catch (error) {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchResumo = useCallback(async () => {
    if (!userId) return null;

    try {
      const response = await fetch(`${API_URL}/api/accounts/${userId}/resumo`);
      const result = await response.json();
      if (result.success) {
        setResumo(result.resumo);
        return result.resumo;
      }
      return null;
    } catch (error) {
      return null;
    }
  }, [userId]);

  const createAccount = async (data) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...data })
      });
      const result = await response.json();
      if (result.success) {
        await fetchAccounts();
        await fetchResumo();
      }
      return result;
    } catch (error) {
      return { success: false, message: 'Erro ao conectar com o servidor' };
    } finally {
      setLoading(false);
    }
  };

  const updateAccount = async (accountId, data) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/accounts/${accountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...data })
      });
      const result = await response.json();
      if (result.success) {
        await fetchAccounts();
        await fetchResumo();
      }
      return result;
    } catch (error) {
      return { success: false, message: 'Erro ao conectar com o servidor' };
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (accountId) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/accounts/${accountId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const result = await response.json();
      if (result.success) {
        await fetchAccounts();
        await fetchResumo();
      }
      return result;
    } catch (error) {
      return { success: false, message: 'Erro ao conectar com o servidor' };
    } finally {
      setLoading(false);
    }
  };

  const transfer = async ({ fromAccountId, toAccountId, valor, descricao }) => {
    setLoading(true);
    try {
      const idempotencyKey = crypto.randomUUID();
      const response = await fetch(`${API_URL}/api/accounts/${userId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromAccountId, toAccountId, valor, descricao, idempotencyKey })
      });
      const result = await response.json();
      if (result.success) {
        await fetchAccounts();
        await fetchResumo();
      }
      return result;
    } catch (error) {
      return { success: false, message: 'Erro ao conectar com o servidor' };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchAccounts();
      fetchResumo();
    }
  }, [userId, fetchAccounts, fetchResumo]);

  return {
    loading, accounts, resumo,
    fetchAccounts, fetchResumo,
    createAccount, updateAccount, deleteAccount, transfer
  };
};
