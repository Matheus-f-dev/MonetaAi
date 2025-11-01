import { useEffect, useRef } from 'react';

export function ReportsChart({ data }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!data) return;
    
    const loadChart = async () => {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);
      
      if (chartRef.current) {
        const ctx = chartRef.current.getContext('2d');
        
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }
        
        chartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: data.labels,
            datasets: [
              {
                label: 'Receitas',
                data: data.receitas,
                backgroundColor: '#10b981',
                borderRadius: 4,
              },
              {
                label: 'Despesas',
                data: data.despesas,
                backgroundColor: '#ef4444',
                borderRadius: 4,
              },
              {
                label: 'Saldo',
                data: data.saldo,
                backgroundColor: '#8b5cf6',
                borderRadius: 4,
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  usePointStyle: true,
                  padding: 20,
                }
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(0,0,0,0.1)',
                },
                ticks: {
                  callback: function(value) {
                    return 'R$ ' + value.toLocaleString('pt-BR');
                  }
                }
              },
              x: {
                grid: {
                  display: false,
                }
              }
            },
          }
        });
      }
    };

    loadChart();

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return (
    <div style={{ height: '400px', width: '100%', position: 'relative' }}>
      <canvas ref={chartRef}></canvas>
    </div>
  );
}