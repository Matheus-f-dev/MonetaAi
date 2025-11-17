import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useEconomias(selectedPeriod, userId) {
  const [economiasData, setEconomiasData] = useState({
    totalEconomias: 0,
    totalReceitas: 0,
    totalDespesas: 0,
    taxaEconomia: 0,
    metaEconomia: 0,
    progressoMeta: 0,
    categoriasEconomia: [],
    evolutionData: [],
    status: { status: 'Regular', color: '#F59E0B' }
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadEconomiasData = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/economias/${userId}?period=${selectedPeriod}`);
        const result = await response.json();
        
        if (result.success) {
          setEconomiasData(result.data);
        }
      } catch (error) {
        console.error('Erro ao carregar dados de economias:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadEconomiasData();
  }, [selectedPeriod, userId]);

  return { ...economiasData, loading };
}