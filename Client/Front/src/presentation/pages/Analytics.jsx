import { useState, useMemo } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useAnalytics } from '../hooks/useAnalytics';
import { useReceitas } from '../hooks/useReceitas';
import { useEconomias } from '../hooks/useEconomias';
import { useTendencias } from '../hooks/useTendencias';
import { Sidebar } from '../components/system/Sidebar';
import { LineChart } from '../components/LineChart';
import { TrendsChart } from '../components/TrendsChart';
import '../styles/pages/Analytics.css';

export default function Analytics() {
  useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState('Este Mês');
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [refreshKey, setRefreshKey] = useState(0);

  const userId = useMemo(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.uid || 'default-user';
  }, []);

  const { 
    totals, 
    percentageChanges, 
    categoryData, 
    evolutionData,
    topCategory,
    expensesTabData,
    cumulativeLineData,
    dailyData
  } = useAnalytics(selectedPeriod, userId);

  const {
    totalReceitas,
    receitaMediaDiaria,
    maiorFonte,
    categoryData: receitasCategoryData,
    evolutionData: receitasEvolutionData,
    loading: receitasLoading
  } = useReceitas(selectedPeriod, userId);

  const {
    totalEconomias,
    taxaEconomia,
    metaEconomia,
    progressoMeta,
    categoriasEconomia,
    evolutionData: economiasEvolutionData,
    status: statusEconomia,
    loading: economiasLoading
  } = useEconomias(selectedPeriod, userId);

  const {
    dadosMensais,
    tendencias,
    previsaoProximoMes,
    categoriasEmAlta,
    padroesSazonais,
    insights,
    loading: tendenciasLoading
  } = useTendencias(selectedPeriod, userId);

  return (
    <div className="sys-layout">
      <Sidebar />
      <main className="analytics-main">
        <div className="analytics-container">
          <div className="analytics-header">
            <h1>Análises Financeiras</h1>
            <select 
              value={selectedPeriod} 
              onChange={(e) => {
                setSelectedPeriod(e.target.value);
                setRefreshKey(prev => prev + 1);
              }}
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

          {activeTab === 'visao-geral' && (
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
          )}

          {activeTab === 'despesas' && (
            <div className="expenses-tab">
              <div className="expenses-kpis">
                <div className="expense-kpi-card">
                  <div className="kpi-label">Maior Categoria</div>
                  <div className="kpi-value">{expensesTabData.topCategory.name}</div>
                  <div className="kpi-change neutral">R$ {(expensesTabData.topCategory.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} no período</div>
                </div>

                <div className="expense-kpi-card">
                  <div className="kpi-label">Categoria com Maior Crescimento</div>
                  <div className="kpi-value">{expensesTabData.fastestGrowingCategory.name}</div>
                  <div className={`kpi-change ${expensesTabData.fastestGrowingCategory.growth > 0 ? 'positive' : expensesTabData.fastestGrowingCategory.growth < 0 ? 'negative' : 'neutral'}`}>
                    {expensesTabData.fastestGrowingCategory.growth !== 0 
                      ? `${expensesTabData.fastestGrowingCategory.growth > 0 ? '+' : ''}${expensesTabData.fastestGrowingCategory.growth}% em relação ao período anterior`
                      : 'Dados insuficientes para comparação'
                    }
                  </div>
                </div>

                <div className="expense-kpi-card">
                  <div className="kpi-label">Gasto Médio Diário</div>
                  <div className="kpi-value">R$ {expensesTabData.dailyAverage.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  <div className="kpi-change neutral">Baseado no período selecionado</div>
                </div>
              </div>

              <div className="expenses-charts">
                <div className="chart-container">
                  <div className="chart-header">
                    <h3>Despesas por Categoria - {selectedPeriod}</h3>
                    <p>Análise detalhada dos seus gastos por categoria</p>
                  </div>
                  <div className="pie-chart">
                    <div className="pie-container">
                      <svg viewBox="0 0 200 200" className="pie-svg">
                        {categoryData.length === 1 && categoryData[0].percentage === 100 ? (
                          <circle
                            cx="100"
                            cy="100"
                            r="80"
                            fill={categoryData[0].color}
                            className="pie-slice"
                            style={{ animationDelay: '0s', cursor: 'pointer' }}
                            onMouseEnter={(e) => {
                              const tooltip = document.createElement('div');
                              tooltip.className = 'pie-tooltip';
                              tooltip.innerHTML = `
                                <div class="tooltip-category">${categoryData[0].name}</div>
                                <div class="tooltip-percentage">${categoryData[0].percentage}%</div>
                                <div class="tooltip-amount">R$ ${(categoryData[0].total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
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
                        ) : (
                          categoryData.map((category, index) => {
                            const angle = (category.percentage / 100) * 360;
                            const startAngle = categoryData.slice(0, index).reduce((sum, cat) => sum + (cat.percentage / 100) * 360, 0);
                            const endAngle = startAngle + angle;
                            
                            const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
                            const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
                            const x2 = 100 + 80 * Math.cos((endAngle - 90) * Math.PI / 180);
                            const y2 = 100 + 80 * Math.sin((endAngle - 90) * Math.PI / 180);
                            
                            const largeArcFlag = angle > 180 ? 1 : 0;
                            
                            return (
                              <g key={category.name}>
                                <path
                                  d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                                  fill={category.color}
                                  className="pie-slice"
                                  style={{ animationDelay: `${index * 0.1}s`, cursor: 'pointer' }}
                                  onMouseEnter={(e) => {
                                    const tooltip = document.createElement('div');
                                    tooltip.className = 'pie-tooltip';
                                    tooltip.innerHTML = `
                                      <div class="tooltip-category">${category.name}</div>
                                      <div class="tooltip-percentage">${category.percentage}%</div>
                                      <div class="tooltip-amount">R$ ${(category.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
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
                          })
                        )}
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
                    <h3>Evolução de Despesas - {selectedPeriod}</h3>
                    <p>Tendência dos seus gastos ao longo do tempo</p>
                  </div>
                  <div className="line-chart">
                    <LineChart data={dailyData} selectedPeriod={selectedPeriod} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'receitas' && (
            <div className="incomes-tab">
              <div className="incomes-kpis">
                <div className="income-kpi-card">
                  <div className="kpi-label">Total de Receitas</div>
                  <div className="kpi-value">R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  <div className="kpi-change neutral">No período selecionado</div>
                </div>

                <div className="income-kpi-card">
                  <div className="kpi-label">Maior Fonte de Receita</div>
                  <div className="kpi-value">{maiorFonte.name}</div>
                  <div className="kpi-change neutral">R$ {maiorFonte.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({maiorFonte.percentage}%)</div>
                </div>

                <div className="income-kpi-card">
                  <div className="kpi-label">Receita Média Diária</div>
                  <div className="kpi-value">R$ {receitaMediaDiaria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  <div className="kpi-change neutral">Baseado no período selecionado</div>
                </div>
              </div>

              <div className="incomes-charts">
                <div className="chart-container">
                  <div className="chart-header">
                    <h3>Receitas por Categoria - {selectedPeriod}</h3>
                    <p>Distribuição das suas receitas por fonte</p>
                  </div>
                  <div className="pie-chart">
                    <div className="pie-container">
                      <svg viewBox="0 0 200 200" className="pie-svg">
                        {receitasCategoryData.length === 1 && receitasCategoryData[0].percentage === 100 ? (
                          <circle
                            cx="100"
                            cy="100"
                            r="80"
                            fill={receitasCategoryData[0].color}
                            className="pie-slice"
                            style={{ animationDelay: '0s', cursor: 'pointer' }}
                            onMouseEnter={(e) => {
                              const tooltip = document.createElement('div');
                              tooltip.className = 'pie-tooltip';
                              tooltip.innerHTML = `
                                <div class="tooltip-category">${receitasCategoryData[0].name}</div>
                                <div class="tooltip-percentage">${receitasCategoryData[0].percentage}%</div>
                                <div class="tooltip-amount">R$ ${(receitasCategoryData[0].total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
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
                        ) : (
                          receitasCategoryData.map((category, index) => {
                            const angle = (category.percentage / 100) * 360;
                            const startAngle = receitasCategoryData.slice(0, index).reduce((sum, cat) => sum + (cat.percentage / 100) * 360, 0);
                            const endAngle = startAngle + angle;
                            
                            const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
                            const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
                            const x2 = 100 + 80 * Math.cos((endAngle - 90) * Math.PI / 180);
                            const y2 = 100 + 80 * Math.sin((endAngle - 90) * Math.PI / 180);
                            
                            const largeArcFlag = angle > 180 ? 1 : 0;
                            
                            return (
                              <g key={category.name}>
                                <path
                                  d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                                  fill={category.color}
                                  className="pie-slice"
                                  style={{ animationDelay: `${index * 0.1}s`, cursor: 'pointer' }}
                                  onMouseEnter={(e) => {
                                    const tooltip = document.createElement('div');
                                    tooltip.className = 'pie-tooltip';
                                    tooltip.innerHTML = `
                                      <div class="tooltip-category">${category.name}</div>
                                      <div class="tooltip-percentage">${category.percentage}%</div>
                                      <div class="tooltip-amount">R$ ${(category.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
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
                          })
                        )}
                      </svg>
                    </div>
                    <div className="pie-legend">
                      {receitasCategoryData.map((category, index) => (
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
                    <h3>Evolução de Receitas - {selectedPeriod}</h3>
                    <p>Tendência das suas receitas ao longo do tempo</p>
                  </div>
                  <div className="bar-chart">
                    <div className="chart-y-axis">
                      {(() => {
                        const maxValue = Math.max(...receitasEvolutionData.map(d => d.value), 1000);
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
                      {receitasEvolutionData.map((data, index) => {
                        const maxValue = Math.max(...receitasEvolutionData.map(d => d.value), 1000);
                        const roundedMax = Math.ceil(maxValue / 1000) * 1000;
                        const heightPercent = (data.value / roundedMax) * 100;
                        const isCurrentMonth = index === receitasEvolutionData.length - 1;
                        
                        return (
                          <div key={index} className="bar-group">
                            <div 
                              className={`analytics-bar ${isCurrentMonth ? 'current-month' : ''}`}
                              style={{ 
                                '--final-height': `${heightPercent}%`,
                                height: `${heightPercent}%`,
                                backgroundColor: isCurrentMonth ? '#10B981' : '#3B82F6',
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
          )}

          {activeTab === 'visao-geral' && (
            <div className="analytics-charts">
            <div className="chart-container">
              <div className="chart-header">
                <h3>Gastos por Categoria - {selectedPeriod}</h3>
                <p>Distribuição dos seus gastos por categoria</p>
              </div>
              <div className="pie-chart">
                <div className="pie-container">
                  <svg viewBox="0 0 200 200" className="pie-svg">
                    {categoryData.length === 1 && categoryData[0].percentage === 100 ? (
                      <circle
                        cx="100"
                        cy="100"
                        r="80"
                        fill={categoryData[0].color}
                        className="pie-slice"
                        style={{ animationDelay: '0s', cursor: 'pointer' }}
                        onMouseEnter={(e) => {
                          const tooltip = document.createElement('div');
                          tooltip.className = 'pie-tooltip';
                          tooltip.innerHTML = `
                            <div class="tooltip-category">${categoryData[0].name}</div>
                            <div class="tooltip-percentage">${categoryData[0].percentage}%</div>
                            <div class="tooltip-amount">R$ ${categoryData[0].total ? categoryData[0].total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</div>
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
                    ) : (
                      categoryData.map((category, index) => {
                        const angle = (category.percentage / 100) * 360;
                        const startAngle = categoryData.slice(0, index).reduce((sum, cat) => sum + (cat.percentage / 100) * 360, 0);
                        const endAngle = startAngle + angle;
                        
                        const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
                        const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
                        const x2 = 100 + 80 * Math.cos((endAngle - 90) * Math.PI / 180);
                        const y2 = 100 + 80 * Math.sin((endAngle - 90) * Math.PI / 180);
                        
                        const largeArcFlag = angle > 180 ? 1 : 0;
                        
                        return (
                          <g key={category.name}>
                            <path
                              d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                              fill={category.color}
                              className="pie-slice"
                              style={{ animationDelay: `${index * 0.1}s`, cursor: 'pointer' }}
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
                      })
                    )}
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
          )}

          {activeTab === 'economias' && (
            <div className="savings-tab">
              <div className="savings-kpis">
                <div className="saving-kpi-card">
                  <div className="kpi-label">Total Economizado</div>
                  <div className="kpi-value">R$ {totalEconomias.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  <div className={`kpi-change ${totalEconomias >= 0 ? 'positive' : 'negative'}`}>
                    {totalEconomias >= 0 ? 'Economia positiva' : 'Déficit no período'}
                  </div>
                </div>

                <div className="saving-kpi-card">
                  <div className="kpi-label">Taxa de Economia</div>
                  <div className="kpi-value">{taxaEconomia.toFixed(1)}%</div>
                  <div className="kpi-change" style={{ color: statusEconomia.color }}>
                    Status: {statusEconomia.status}
                  </div>
                </div>

                <div className="saving-kpi-card">
                  <div className="kpi-label">Meta de Economia (30%)</div>
                  <div className="kpi-value">R$ {metaEconomia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  <div className="kpi-change neutral">
                    Progresso: {progressoMeta.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="savings-charts">
                <div className="chart-container">
                  <div className="chart-header">
                    <h3>Potencial de Economia por Categoria - {selectedPeriod}</h3>
                    <p>Onde você pode economizar mais</p>
                  </div>
                  <div className="savings-categories">
                    {categoriasEconomia.map((categoria, index) => (
                      <div key={categoria.name} className="savings-category-item">
                        <div className="category-info">
                          <div className="category-name">{categoria.name}</div>
                          <div className="category-stats">
                            <span>Gasto atual: R$ {categoria.gastoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <span>Potencial economia: R$ {categoria.potencialEconomia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                        <div className="category-bar">
                          <div 
                            className="category-progress" 
                            style={{ 
                              width: `${categoria.percentualReceita}%`,
                              backgroundColor: categoria.color
                            }}
                          ></div>
                        </div>
                        <div className="category-percentage">{categoria.percentualReceita}%</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="chart-container">
                  <div className="chart-header">
                    <h3>Evolução das Economias - {selectedPeriod}</h3>
                    <p>Como suas economias evoluíram no tempo</p>
                  </div>
                  <div className="savings-evolution">
                    <div className="chart-y-axis">
                      {(() => {
                        const values = economiasEvolutionData.map(d => d.economia);
                        const maxValue = Math.max(...values, 1000);
                        const minValue = Math.min(...values, -1000);
                        const range = maxValue - minValue;
                        const step = range / 4;
                        return [
                          <span key="4">R$ {maxValue.toLocaleString('pt-BR')}</span>,
                          <span key="3">R$ {(maxValue - step).toLocaleString('pt-BR')}</span>,
                          <span key="2">R$ {(maxValue - step * 2).toLocaleString('pt-BR')}</span>,
                          <span key="1">R$ {(maxValue - step * 3).toLocaleString('pt-BR')}</span>,
                          <span key="0">R$ {minValue.toLocaleString('pt-BR')}</span>
                        ];
                      })()} 
                    </div>
                    <div className="chart-bars">
                      {economiasEvolutionData.map((data, index) => {
                        const values = economiasEvolutionData.map(d => d.economia);
                        const maxValue = Math.max(...values, 1000);
                        const minValue = Math.min(...values, -1000);
                        const range = maxValue - minValue;
                        const normalizedValue = ((data.economia - minValue) / range) * 100;
                        const isPositive = data.economia >= 0;
                        
                        return (
                          <div key={index} className="bar-group">
                            <div 
                              className={`analytics-bar ${isPositive ? 'positive-savings' : 'negative-savings'}`}
                              style={{ 
                                '--final-height': `${normalizedValue}%`,
                                height: `${normalizedValue}%`,
                                backgroundColor: isPositive ? '#10B981' : '#EF4444',
                                animationDelay: `${index * 0.1}s`
                              }}
                              title={`${data.month}: R$ ${data.economia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            >
                              <div className="bar-tooltip">
                                <span className="tooltip-month">{data.month}</span>
                                <span className="tooltip-value">R$ {data.economia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
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
          )}

          {activeTab === 'tendencias' && (
            <div className="trends-tab">
              <div className="trends-kpis">
                <div className="trend-kpi-card">
                  <div className="kpi-label">Tendência de Receitas</div>
                  <div className="kpi-value" style={{ color: tendencias.receitas.status === 'positivo' ? '#10B981' : tendencias.receitas.status === 'negativo' ? '#EF4444' : '#6B7280' }}>
                    {tendencias.receitas.direcao}
                  </div>
                  <div className="kpi-change neutral">
                    {tendencias.receitas.percentual.toFixed(1)}% ao mês
                  </div>
                </div>

                <div className="trend-kpi-card">
                  <div className="kpi-label">Tendência de Despesas</div>
                  <div className="kpi-value" style={{ color: tendencias.despesas.status === 'positivo' ? '#10B981' : tendencias.despesas.status === 'negativo' ? '#EF4444' : '#6B7280' }}>
                    {tendencias.despesas.direcao}
                  </div>
                  <div className="kpi-change neutral">
                    {tendencias.despesas.percentual.toFixed(1)}% ao mês
                  </div>
                </div>

                <div className="trend-kpi-card">
                  <div className="kpi-label">Tendência de Economias</div>
                  <div className="kpi-value" style={{ color: tendencias.economias.status === 'positivo' ? '#10B981' : tendencias.economias.status === 'negativo' ? '#EF4444' : '#6B7280' }}>
                    {tendencias.economias.direcao}
                  </div>
                  <div className="kpi-change neutral">
                    {tendencias.economias.percentual.toFixed(1)}% ao mês
                  </div>
                </div>
              </div>

              <div className="trends-charts">
                <div className="chart-container">
                  <div className="chart-header">
                    <h3>Evolução Mensal - {selectedPeriod}</h3>
                    <p>Comparação entre receitas, despesas e economias</p>
                  </div>
                  <div className="trends-chart-container">
                    <TrendsChart dadosMensais={dadosMensais} />
                  </div>
                </div>

                <div className="chart-container">
                  <div className="chart-header">
                    <h3>Insights e Previsões</h3>
                    <p>Análise preditiva baseada nos seus dados</p>
                  </div>
                  <div className="trends-insights">
                    {previsaoProximoMes && (
                      <div className="prediction-card">
                        <h4>Previsão Próximo Mês</h4>
                        <div className="prediction-values">
                          <div className="prediction-item">
                            <span className="prediction-label">Receitas</span>
                            <span className="prediction-value">R$ {previsaoProximoMes.receitas.toLocaleString('pt-BR')}</span>
                          </div>
                          <div className="prediction-item">
                            <span className="prediction-label">Despesas</span>
                            <span className="prediction-value">R$ {previsaoProximoMes.despesas.toLocaleString('pt-BR')}</span>
                          </div>
                          <div className="prediction-item">
                            <span className="prediction-label">Economia</span>
                            <span className={`prediction-value ${previsaoProximoMes.economia >= 0 ? 'positive' : 'negative'}`}>
                              R$ {previsaoProximoMes.economia.toLocaleString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="insights-list">
                      <h4>Insights Automáticos</h4>
                      {insights.length > 0 ? (
                        insights.map((insight, index) => (
                          <div key={index} className={`insight-item ${insight.tipo}`}>
                            <div className="insight-title">{insight.titulo}</div>
                            <div className="insight-description">{insight.descricao}</div>
                          </div>
                        ))
                      ) : (
                        <div className="no-insights">Nenhum insight disponível no momento</div>
                      )}
                    </div>

                    {categoriasEmAlta.length > 0 && (
                      <div className="categories-trending">
                        <h4>Categorias em Alta</h4>
                        {categoriasEmAlta.map((categoria, index) => (
                          <div key={index} className="trending-item">
                            <span className="trending-category">{categoria.categoria}</span>
                            <span className={`trending-growth ${categoria.status}`}>
                              {categoria.crescimento > 0 ? '+' : ''}{categoria.crescimento.toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}