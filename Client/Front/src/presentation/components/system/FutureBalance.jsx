import { useState, useEffect, useRef } from 'react';

export function FutureBalance({ transactions, userSalary }) {
  const [period, setPeriod] = useState(12);
  const [projectionData, setProjectionData] = useState([]);
  const [scenarios, setScenarios] = useState({ optimistic: [], realistic: [], pessimistic: [] });
  const [activeScenario, setActiveScenario] = useState('realistic');
  const [currentBalance, setCurrentBalance] = useState(0);
  const [futureBalance, setFutureBalance] = useState(0);
  const [totalVariation, setTotalVariation] = useState(0);
  const [trend, setTrend] = useState('estável');
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, value: 0, month: 0 });
  const canvasRef = useRef(null);

  useEffect(() => {
    calculateProjection();
  }, [transactions, period, userSalary]);

  const calculateProjection = async () => {
    if (!transactions || transactions.length === 0) return;
    
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
      const activeData = data.cenarios[activeScenario];
      setProjectionData(activeData);
      setFutureBalance(activeData[activeData.length - 1]?.balance || data.saldoAtual);
      setTotalVariation((activeData[activeData.length - 1]?.balance || data.saldoAtual) - data.saldoAtual);
      
      drawChart(activeData);
    } catch (error) {
      console.error('Erro ao calcular projeção:', error);
    }
  };

  useEffect(() => {
    if (scenarios[activeScenario]?.length > 0) {
      const scenarioData = scenarios[activeScenario];
      setProjectionData(scenarioData);
      setFutureBalance(scenarioData[scenarioData.length - 1]?.balance || 0);
      setTotalVariation((scenarioData[scenarioData.length - 1]?.balance || 0) - currentBalance);
      drawChart(scenarioData);
    }
  }, [activeScenario, scenarios, currentBalance]);

  const drawChart = (data) => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    
    ctx.clearRect(0, 0, width, height);
    
    const padding = 60;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    const maxValue = Math.max(...data.map(d => d.balance));
    const minValue = Math.min(...data.map(d => d.balance));
    const range = maxValue - minValue || 1;

    // Grid lines
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (i / 4) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
    }

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, padding, 0, padding + chartHeight);
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0.05)');

    // Area under curve
    ctx.beginPath();
    ctx.fillStyle = gradient;
    
    data.forEach((point, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((point.balance - minValue) / range) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.closePath();
    ctx.fill();

    // Main line with shadow
    ctx.shadowColor = 'rgba(139, 92, 246, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    
    ctx.beginPath();
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    data.forEach((point, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((point.balance - minValue) / range) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Uma bolinha para cada mês
    for (let month = 0; month < period; month++) {
      const dataIndex = Math.floor((month / (period - 1)) * (data.length - 1));
      const point = data[dataIndex];
      
      if (point) {
        const x = padding + (dataIndex / (data.length - 1)) * chartWidth;
        const y = padding + chartHeight - ((point.balance - minValue) / range) * chartHeight;
        
        ctx.beginPath();
        ctx.fillStyle = '#8b5cf6';
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.arc(x, y, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Y-axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 4; i++) {
      const value = minValue + (range * i / 4);
      const y = padding + chartHeight - (i / 4) * chartHeight;
      ctx.fillText(`R$ ${value.toLocaleString('pt-BR')}`, padding - 15, y + 4);
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || projectionData.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const padding = 60;
    const chartWidth = canvas.width - 2 * padding;
    
    if (x >= padding && x <= padding + chartWidth) {
      const relativeX = (x - padding) / chartWidth;
      const dataIndex = Math.round(relativeX * (projectionData.length - 1));
      
      if (dataIndex >= 0 && dataIndex < projectionData.length) {
        setTooltip({
          show: true,
          x: e.clientX,
          y: e.clientY - 10,
          value: projectionData[dataIndex].balance,
          month: dataIndex
        });
      }
    } else {
      setTooltip({ ...tooltip, show: false });
    }
  };

  const handleMouseLeave = () => {
    setTooltip({ ...tooltip, show: false });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const monthLabels = Array.from({ length: period }, (_, i) => `Mês ${i + 1}`);

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
              onClick={() => setActiveScenario('optimistic')}
            >
              📈 Otimista
            </button>
            <button 
              className={`scenario-btn ${activeScenario === 'realistic' ? 'active' : ''}`}
              onClick={() => setActiveScenario('realistic')}
            >
              🎯 Realista
            </button>
            <button 
              className={`scenario-btn ${activeScenario === 'pessimistic' ? 'active' : ''}`}
              onClick={() => setActiveScenario('pessimistic')}
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
        <canvas 
          ref={canvasRef}
          width={800} 
          height={300}
          className="projection-chart"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        <div className="month-labels">
          {monthLabels.map((label, index) => (
            <span key={index} className="month-label">{label}</span>
          ))}
        </div>
        {tooltip.show && (
          <div 
            className="chart-tooltip"
            style={{
              position: 'fixed',
              left: tooltip.x,
              top: tooltip.y,
              transform: 'translateX(-50%)'
            }}
          >
            <div>Mês {tooltip.month + 1}</div>
            <div>{formatCurrency(tooltip.value)}</div>
          </div>
        )}
      </div>

      <div className="disclaimer">
        * Projeção baseada no padrão atual de receitas e despesas
      </div>
    </div>
  );
}