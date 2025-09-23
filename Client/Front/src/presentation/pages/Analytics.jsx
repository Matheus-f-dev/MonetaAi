import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useAnalytics } from '../hooks/useAnalytics';
import { Sidebar } from '../components/system/Sidebar';
import '../styles/pages/Analytics.css';

export default function Analytics() {
  useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState('Este Mês');
  const [activeTab, setActiveTab] = useState('visao-geral');

  const { 
    totals, 
    percentageChanges, 
    categoryData, 
    evolutionData,
    topCategory 
  } = useAnalytics(selectedPeriod);

  return (
    <div className="sys-layout">
      <Sidebar />
      <main className="analytics-main">
        <div className="analytics-container">
          <div className="analytics-header">
            <h1>Análises Financeiras</h1>
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="period-select"
            >
              <option>Este Mês</option>
              <option>Últimos 3 Meses</option>
              <option>Este Ano</option>
            </select>
          </div>

          <div className="analytics-tabs">
            <button 
              className={`analytics-tab ${activeTab === 'visao-geral' ? 'active' : ''}`}
              onClick={() => setActiveTab('visao-geral')}
            >
              Visão Geral
            </button>
            <button 
              className={`analytics-tab ${activeTab === 'despesas' ? 'active' : ''}`}
              onClick={() => setActiveTab('despesas')}
            >
              Despesas
            </button>
            <button 
              className={`analytics-tab ${activeTab === 'receitas' ? 'active' : ''}`}
              onClick={() => setActiveTab('receitas')}
            >
              Receitas
            </button>
            <button 
              className={`analytics-tab ${activeTab === 'economias' ? 'active' : ''}`}
              onClick={() => setActiveTab('economias')}
            >
              Economias
            </button>
            <button 
              className={`analytics-tab ${activeTab === 'tendencias' ? 'active' : ''}`}
              onClick={() => setActiveTab('tendencias')}
            >
              Tendências
            </button>
          </div>

          <div className="analytics-kpis">
            <div className="kpi-card">
              <div className="kpi-label">Total de Despesas</div>
              <div className="kpi-value">R$ {totals.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div className={`kpi-change ${percentageChanges.expenses >= 0 ? 'positive' : 'negative'}`}>
                {percentageChanges.expenses >= 0 ? '+' : ''}{percentageChanges.expenses}% em relação ao período anterior
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-label">Total de Receitas</div>
              <div className="kpi-value">R$ {totals.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div className={`kpi-change ${percentageChanges.income >= 0 ? 'positive' : 'negative'}`}>
                {percentageChanges.income >= 0 ? '+' : ''}{percentageChanges.income}% em relação ao período anterior
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-label">Economias</div>
              <div className="kpi-value">R$ {totals.savings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div className={`kpi-change ${percentageChanges.savings >= 0 ? 'positive' : 'negative'}`}>
                {percentageChanges.savings}% na taxa de economia
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-label">Maior Categoria</div>
              <div className="kpi-value">{topCategory.name}</div>
              <div className="kpi-change neutral">
                {topCategory.percentage}% dos seus gastos
              </div>
            </div>
          </div>

          <div className="analytics-charts">
            <div className="chart-container">
              <div className="chart-header">
                <h3>Gastos por Categoria - {selectedPeriod}</h3>
                <p>Distribuição dos seus gastos por categoria</p>
              </div>
              <div className="pie-chart">
                <div className="pie-container">
                  <svg viewBox="0 0 200 200" className="pie-svg">
                    {categoryData.map((category, index) => {
                      const angle = (category.percentage / 100) * 360;
                      const startAngle = categoryData.slice(0, index).reduce((sum, cat) => sum + (cat.percentage / 100) * 360, 0);
                      const endAngle = startAngle + angle;
                      
                      const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
                      const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
                      const x2 = 100 + 80 * Math.cos((endAngle - 90) * Math.PI / 180);
                      const y2 = 100 + 80 * Math.sin((endAngle - 90) * Math.PI / 180);
                      
                      const largeArcFlag = angle > 180 ? 1 : 0;
                      
                      // Calcular posição do label
                      const labelAngle = (startAngle + endAngle) / 2;
                      const labelRadius = 60;
                      const labelX = 100 + labelRadius * Math.cos((labelAngle - 90) * Math.PI / 180);
                      const labelY = 100 + labelRadius * Math.sin((labelAngle - 90) * Math.PI / 180);
                      
                      return (
                        <g key={category.name}>
                          <path
                            d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                            fill={category.color}
                            className="pie-slice"
                            style={{ animationDelay: `${index * 0.1}s` }}
                            onMouseEnter={(e) => {
                              const tooltip = document.createElement('div');
                              tooltip.className = 'pie-tooltip';
                              tooltip.innerHTML = `
                                <div class="tooltip-category">${category.name}</div>
                                <div class="tooltip-percentage">${category.percentage}%</div>
                                <div class="tooltip-amount">R$ ${category.total ? category.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</div>
                              `;
                              document.body.appendChild(tooltip);
                              
                              const updatePosition = (event) => {
                                tooltip.style.left = event.pageX + 10 + 'px';
                                tooltip.style.top = event.pageY - 10 + 'px';
                              };
                              
                              updatePosition(e);
                              e.target.addEventListener('mousemove', updatePosition);
                              e.target.tooltip = tooltip;
                              e.target.updatePosition = updatePosition;
                            }}
                            onMouseLeave={(e) => {
                              if (e.target.tooltip) {
                                e.target.removeEventListener('mousemove', e.target.updatePosition);
                                document.body.removeChild(e.target.tooltip);
                                e.target.tooltip = null;
                              }
                            }}
                          />
                        </g>
                      );
                    })}
                  </svg>

                </div>
                <div className="pie-legend">
                  {categoryData.map((category, index) => (
                    <div key={category.name} className="legend-item" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="legend-color" style={{ backgroundColor: category.color }}></div>
                      <span className="legend-label">{category.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="chart-container">
              <div className="chart-header">
                <h3>Evolução de Gastos - {selectedPeriod}</h3>
                <p>Como seus gastos evoluíram no período</p>
              </div>
              <div className="bar-chart">
                <div className="chart-y-axis">
                  {(() => {
                    const maxValue = Math.max(...evolutionData.map(d => d.value), 1000);
                    const roundedMax = Math.ceil(maxValue / 1000) * 1000;
                    const step = roundedMax / 4;
                    return [
                      <span key="4">R$ {roundedMax.toLocaleString('pt-BR')}</span>,
                      <span key="3">R$ {(roundedMax - step).toLocaleString('pt-BR')}</span>,
                      <span key="2">R$ {(roundedMax - step * 2).toLocaleString('pt-BR')}</span>,
                      <span key="1">R$ {(roundedMax - step * 3).toLocaleString('pt-BR')}</span>,
                      <span key="0">R$ 0</span>
                    ];
                  })()} 
                </div>
                <div className="chart-bars">
                  {evolutionData.map((data, index) => {
                    const maxValue = Math.max(...evolutionData.map(d => d.value), 1000);
                    const roundedMax = Math.ceil(maxValue / 1000) * 1000;
                    const heightPercent = (data.value / roundedMax) * 100;
                    const isCurrentMonth = index === evolutionData.length - 1;
                    
                    return (
                      <div key={index} className="bar-group">
                        <div 
                          className={`analytics-bar ${isCurrentMonth ? 'current-month' : ''}`}
                          style={{ 
                            '--final-height': `${heightPercent}%`,
                            height: `${heightPercent}%`,
                            backgroundColor: isCurrentMonth ? '#EF4444' : '#8B5CF6',
                            animationDelay: `${index * 0.1}s`
                          }}
                          title={`${data.month}: R$ ${data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        >
                          <div className="bar-tooltip">
                            <span className="tooltip-month">{data.month}</span>
                            <span className="tooltip-value">R$ {data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                        <span className="bar-label">{data.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}