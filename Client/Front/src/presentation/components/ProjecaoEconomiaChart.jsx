import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export default function ProjecaoEconomiaChart({ analise }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!analise || !chartRef.current) return;

    // Destruir gráfico anterior se existir
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    
    // Calcular dados de projeção
    const meses = Math.min(analise.analise.tempoParaJuntar || 12, 24);
    const economiaMedia = analise.analise.economiaMedia || 0;
    const valorMeta = analise.valor;
    
    const labels = [];
    const dados = [];
    let acumulado = 0;
    
    for (let i = 0; i <= meses; i++) {
      labels.push(i === 0 ? 'Hoje' : `${i}º mês`);
      dados.push(acumulado);
      if (i < meses) {
        acumulado += economiaMedia;
      }
    }

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Economia Acumulada',
            data: dados,
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#8b5cf6',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 5
          },
          {
            label: 'Meta',
            data: new Array(labels.length).fill(valorMeta),
            borderColor: '#ef4444',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: 'var(--text-primary)',
              usePointStyle: true,
              padding: 20
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'var(--border)',
              drawBorder: false
            },
            ticks: {
              color: 'var(--text-secondary)',
              maxTicksLimit: 8
            }
          },
          y: {
            grid: {
              color: 'var(--border)',
              drawBorder: false
            },
            ticks: {
              color: 'var(--text-secondary)',
              callback: function(value) {
                return new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0
                }).format(value);
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [analise]);

  if (!analise) return null;

  return (
    <div className="projecao-chart-container">
      <h3>Projeção de Economia</h3>
      <div className="chart-wrapper">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
}