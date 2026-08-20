import { useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const usePeople = (userId = null) => {
  const [loading, setLoading] = useState(false);
  const [people, setPeople] = useState([]);

  const fetchPeople = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/split/${userId}/people`);
      const result = await response.json();
      setPeople(result.success ? (result.people || []) : []);
    } catch (error) {
      setPeople([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const setParticipantPaid = async (transactionId, participantIndex, pago) => {
    try {
      const response = await fetch(
        `${API_URL}/api/split/transactions/${transactionId}/participants/${participantIndex}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, pago })
        }
      );
      const result = await response.json();
      if (result.success) await fetchPeople();
      return result;
    } catch (error) {
      return { success: false, message: 'Erro ao conectar com o servidor' };
    }
  };

  useEffect(() => {
    if (userId) fetchPeople();
  }, [userId, fetchPeople]);

  return { loading, people, fetchPeople, setParticipantPaid };
};
