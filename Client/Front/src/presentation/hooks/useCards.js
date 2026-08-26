import { useState, useEffect, useCallback } from 'react';
import { getAuthHeaders } from '../../shared/authHeaders';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useCards = (userId = null) => {
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState([]);
  const [invoices, setInvoices] = useState({}); // cardId -> invoice data

  const fetchCards = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/cards/${userId}`, { headers: getAuthHeaders() });
      const result = await response.json();
      setCards(result.success ? (result.cards || []) : []);
    } catch (error) {
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchInvoice = useCallback(async (cardId) => {
    if (!userId || !cardId) return null;

    try {
      const response = await fetch(`${API_URL}/api/cards/${userId}/${cardId}/invoice`, { headers: getAuthHeaders() });
      const result = await response.json();
      if (result.success) {
        setInvoices(prev => ({ ...prev, [cardId]: result.invoice }));
        return result.invoice;
      }
      return null;
    } catch (error) {
      return null;
    }
  }, [userId]);

  const createCard = async (cardData) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/cards`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId, ...cardData })
      });
      const result = await response.json();
      if (result.success) await fetchCards();
      return result;
    } catch (error) {
      return { success: false, message: 'Erro ao conectar com o servidor' };
    } finally {
      setLoading(false);
    }
  };

  const updateCard = async (cardId, cardData) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/cards/${cardId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId, ...cardData })
      });
      const result = await response.json();
      if (result.success) await fetchCards();
      return result;
    } catch (error) {
      return { success: false, message: 'Erro ao conectar com o servidor' };
    } finally {
      setLoading(false);
    }
  };

  const deleteCard = async (cardId) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/cards/${cardId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId })
      });
      const result = await response.json();
      if (result.success) await fetchCards();
      return result;
    } catch (error) {
      return { success: false, message: 'Erro ao conectar com o servidor' };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchCards();
  }, [userId, fetchCards]);

  useEffect(() => {
    cards.forEach(card => fetchInvoice(card.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length, userId]);

  return { loading, cards, invoices, fetchCards, fetchInvoice, createCard, updateCard, deleteCard };
};
