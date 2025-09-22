import { useState } from 'react';
import { Line } from 'react-chartjs-2';

export function ChartCard({ chartData, chartOptions, onFilterChange, activeFilter = 'month' }) {
  const handleFilterClick = (filter) => {
    onFilterChange(filter);
  };

  return (
    <div className="sys-card sys-card-big">
      <div className="sys-card-head">
        <div>
          <div className="sys-card-title">Distribuição Acumulativa</div>
          <div className="sys-small">Acompanhe o acúmulo de receitas e despesas</div>
        </div>
        <div className="sys-segmented">
          <button 
            className={`sys-seg ${activeFilter === 'week' ? 'sys-active' : ''}`}
            onClick={() => handleFilterClick('week')}
          >
            Semana
          </button>
          <button 
            className={`sys-seg ${activeFilter === 'month' ? 'sys-active' : ''}`}
            onClick={() => handleFilterClick('month')}
          >
            Mês
          </button>
          <button 
            className={`sys-seg ${activeFilter === 'year' ? 'sys-active' : ''}`}
            onClick={() => handleFilterClick('year')}
          >
            Ano
          </button>
        </div>
      </div>

      <div className="sys-chart">
        <div className="chart-container">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}