import { useState, useEffect } from 'react';

export const useAlerts = (userId = null) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [alerts, setAlerts] = useState([]);

  const fetchAlerts = async () => {
    if (!userId) {

      return;
    }
    

    setLoading(true);
    
    try {
      const url = `http://localhost:3000/api/alerts/${userId}`;

      
      const response = await fetch(url);

      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();

      
      if (result.success) {
        setAlerts(result.alerts || []);
      } else {

        setAlerts([]);
      }
    } catch (error) {

      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const createAlert = async (alertData) => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('http://localhost:3000/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData)
      });
      
      const result = await response.json();
      setMessage(result.message || (result.success ? 'Alerta criado com sucesso!' : 'Erro ao criar alerta'));
      
      if (result.success) {
        fetchAlerts();
      }
      
      return result;
    } catch (error) {
      const errorMsg = 'Erro ao conectar com o servidor';
      setMessage(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const updateAlert = async (alertId, alertData) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/alerts/${alertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        fetchAlerts();
      }
      
      return result;
    } catch (error) {
      return { success: false, message: 'Erro ao conectar com o servidor' };
    } finally {
      setLoading(false);
    }
  };

  const deleteAlert = async (alertId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/alerts/${alertId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      const result = await response.json();
      
      if (result.success) {
        fetchAlerts();
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
      fetchAlerts();
    }
  }, [userId]);

  return {
    loading,
    message,
    alerts,
    createAlert,
    updateAlert,
    deleteAlert,
    fetchAlerts
  };
};