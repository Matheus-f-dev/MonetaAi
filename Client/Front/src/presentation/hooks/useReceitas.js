import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useReceitas(selectedPeriod, userId) {
  const [receitasData, setReceitasData] = useState({
    totalReceitas: 0,
    receitaMediaDiaria: 0,
    maiorFonte: { name: 'Sem dados', total: 0, percentage: 0 },
    categoryData: [],
    evolutionData: []
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadReceitasData = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/receitas/${userId}?period=${selectedPeriod}`);
        const result = await response.json();
        
        if (result.success) {
          setReceitasData(result.data);
        }
      } catch (error) {
        console.error('Erro ao carregar dados de receitas:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadReceitasData();
  }, [selectedPeriod, userId]);

  return { ...receitasData, loading };
}