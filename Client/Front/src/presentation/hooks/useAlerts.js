import { useState } from 'react';

export const useAlerts = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
      return result;
    } catch (error) {
      const errorMsg = 'Erro ao conectar com o servidor';
      setMessage(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    message,
    createAlert
  };
};