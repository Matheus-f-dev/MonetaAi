import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export function TrendsChart({ dadosMensais }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    
    chartInstance.current = new ChartJS(ctx, {
      type: 'line',
      data: {
        labels: dadosMensais.map(d => d.month),
        datasets: [
          {
            label: 'Receitas',
            data: dadosMensais.map(d => d.receitas),
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            fill: false,
            tension: 0.4,
          },
          {
            label: 'Despesas',
            data: dadosMensais.map(d => d.despesas),
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 3,
            fill: false,
            tension: 0.4,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: R$ ${context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
              }
            }
          },
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Mês'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Valor (R$)'
            },
            ticks: {
              callback: function(value) {
                return 'R$ ' + value.toLocaleString('pt-BR');
              }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [dadosMensais]);

  return <canvas ref={chartRef} style={{ maxHeight: '300px' }} />;
}