import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useImpactoFinanceiro = () => {
  const [loading, setLoading] = useState(false);
  const [analise, setAnalise] = useState(null);
  const [error, setError] = useState('');

  const calcularImpacto = async (produto, valor) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.uid;

    if (!userId) {
      setError('Usuário não encontrado');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/impacto-financeiro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, produto, valor })
      });

      const data = await response.json();

      if (data.success) {
        setAnalise(data.analise);
      } else {
        setError(data.message || 'Erro ao calcular impacto');
      }
    } catch (error) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const limparAnalise = () => {
    setAnalise(null);
    setError('');
  };

  return {
    loading,
    analise,
    error,
    calcularImpacto,
    limparAnalise
  };
};