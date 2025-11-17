import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useTendencias(selectedPeriod, userId) {
  const [tendenciasData, setTendenciasData] = useState({
    dadosMensais: [],
    tendencias: {
      receitas: { direcao: 'estável', percentual: 0, status: 'neutro' },
      despesas: { direcao: 'estável', percentual: 0, status: 'neutro' },
      economias: { direcao: 'estável', percentual: 0, status: 'neutro' }
    },
    previsaoProximoMes: null,
    categoriasEmAlta: [],
    padroesSazonais: [],
    insights: []
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTendenciasData = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/tendencias/${userId}?period=${selectedPeriod}`);
        const result = await response.json();
        
        if (result.success) {
          setTendenciasData(result.data);
        }
      } catch (error) {
        console.error('Erro ao carregar dados de tendências:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadTendenciasData();
  }, [selectedPeriod, userId]);

  return { ...tendenciasData, loading };
}