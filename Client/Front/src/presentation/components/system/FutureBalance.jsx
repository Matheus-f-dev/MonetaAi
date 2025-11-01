import { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';

export function FutureBalance({ transactions, userSalary }) {
  const [period, setPeriod] = useState(12);
  const [projectionData, setProjectionData] = useState([]);
  const [scenarios, setScenarios] = useState({ optimistic: [], realistic: [], pessimistic: [] });
  const [activeScenario, setActiveScenario] = useState('realistic');
  const [currentBalance, setCurrentBalance] = useState(0);
  const [futureBalance, setFutureBalance] = useState(0);
  const [totalVariation, setTotalVariation] = useState(0);
  const [trend, setTrend] = useState('estável');
  const [chartData, setChartData] = useState(null);

  useEffect(() => {

    calculateProjection();
  }, [transactions, period, userSalary]);

  const calculateProjection = async () => {
    if (!transactions || transactions.length === 0) {
      // Dados padrão quando não há transações
      const defaultData = [{ month: 0, balance: 0 }];
      setScenarios({ optimistic: defaultData, realistic: defaultData, pessimistic: defaultData });
      setCurrentBalance(0);
      setTrend('estável');
      setProjectionData(defaultData);
      setFutureBalance(0);
      setTotalVariation(0);
      drawChart(defaultData);
      return;
    }
    
    try {
      const res = await fetch(`http://localhost:3000/api/projecao-saldo/${period}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions })
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      

      
      setScenarios(data.cenarios);
      setCurrentBalance(data.saldoAtual);
      setTrend(data.tendencia);
      
      // Atualizar com cenário ativo
      const activeData = data.cenarios[activeScenario] || [{ month: 0, balance: data.saldoAtual }];
      setProjectionData(activeData);
      setFutureBalance(activeData[activeData.length - 1]?.balance || data.saldoAtual);
      setTotalVariation((activeData[activeData.length - 1]?.balance || data.saldoAtual) - data.saldoAtual);
      
      updateChartData(activeData);
    } catch (error) {
      console.error('Erro ao calcular projeção:', error);
      // Fallback em caso de erro
      const fallbackData = [{ month: 0, balance: currentBalance }];
      setProjectionData(fallbackData);
      updateChartData(fallbackData);
    }
  };

  useEffect(() => {
    if (scenarios[activeScenario]?.length > 0) {
      const scenarioData = scenarios[activeScenario];
      setProjectionData(scenarioData);
      setFutureBalance(scenarioData[scenarioData.length - 1]?.balance || 0);
      setTotalVariation((scenarioData[scenarioData.length - 1]?.balance || 0) - currentBalance);
      
      updateChartData(scenarioData);
    }
  }, [activeScenario, scenarios, currentBalance]);

  const updateChartData = (data) => {
    if (!data || data.length === 0) return;
    
    setChartData({
      labels: data.map((_, index) => `Mês ${index + 1}`),
      datasets: [{
        label: `Cenário ${activeScenario === 'optimistic' ? 'Otimista' : activeScenario === 'realistic' ? 'Realista' : 'Pessimista'}`,
        data: data.map(d => d.balance),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6
      }]
    });
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: (value) => formatCurrency(value)
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.2)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };



  return (
    <div className="future-balance-container">
      <div className="future-balance-header">
        <div>
          <h1>📈 Projeção de Saldo Futuro</h1>
          <p className="subtitle">Como seu saldo pode evoluir baseado no padrão atual</p>
        </div>
        <button className={`btn-trend ${trend}`}>
          {trend === 'crescendo' && '📈 Crescendo'}
          {trend === 'decaindo' && '📉 Decaindo'}
          {trend === 'estável' && '➡️ Estável'}
        </button>
      </div>

      <div className="controls-section">
        <div className="period-section">
          <label htmlFor="period">Período de Projeção</label>
          <select 
            id="period" 
            value={period} 
            onChange={(e) => setPeriod(parseInt(e.target.value))}
          >
            <option value={6}>6 meses</option>
            <option value={12}>1 ano</option>
            <option value={24}>2 anos</option>
          </select>
        </div>
        
        <div className="scenario-section">
          <label>Cenário</label>
          <div className="scenario-buttons">
            <button 
              className={`scenario-btn ${activeScenario === 'optimistic' ? 'active' : ''}`}
              onClick={() => {
                setActiveScenario('optimistic');

              }}
            >
              📈 Otimista
            </button>
            <button 
              className={`scenario-btn ${activeScenario === 'realistic' ? 'active' : ''}`}
              onClick={() => {
                setActiveScenario('realistic');

              }}
            >
              🎯 Realista
            </button>
            <button 
              className={`scenario-btn ${activeScenario === 'pessimistic' ? 'active' : ''}`}
              onClick={() => {
                setActiveScenario('pessimistic');

              }}
            >
              📉 Pessimista
            </button>
          </div>
        </div>
      </div>

      <div className="balance-cards">
        <div className="balance-card">
          <div className="card-label">Saldo Atual</div>
          <div className="card-value">{formatCurrency(currentBalance)}</div>
        </div>
        <div className="balance-card">
          <div className="card-label">Saldo em {period} meses</div>
          <div className="card-value">{formatCurrency(futureBalance)}</div>
        </div>
        <div className="balance-card">
          <div className="card-label">Variação Total</div>
          <div className={`card-value ${totalVariation >= 0 ? 'positive' : 'negative'}`}>
            {totalVariation >= 0 ? '📈' : '📉'} {formatCurrency(Math.abs(totalVariation))}
          </div>
        </div>
      </div>

      <div className="chart-section">
        {chartData && (
          <div style={{ height: '300px' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
      </div>

      <div className="disclaimer">
        * Projeção baseada no padrão atual de receitas e despesas
      </div>
    </div>
  );
}