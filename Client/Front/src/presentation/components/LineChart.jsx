import { useMemo } from 'react';

export function LineChart({ data, selectedPeriod }) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return { points: [], maxValue: 100, labels: [] };
    }

    const maxValue = Math.max(...data.map(d => d.value), 100);
    const points = data.map((item, index) => {
      const x = 50 + (index * (320 / Math.max(data.length - 1, 1)));
      const y = 180 - ((item.value / maxValue) * 160);
      return { x, y, ...item };
    });

    return { points, maxValue, labels: data };
  }, [data]);

  const yAxisLabels = useMemo(() => {
    const { maxValue } = chartData;
    const roundedMax = Math.ceil(maxValue / 1000) * 1000;
    return [0, 1, 2, 3, 4].map(i => {
      const value = (roundedMax / 4) * (4 - i);
      return {
        y: 20 + i * 40,
        value: value,
        label: `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
      };
    });
  }, [chartData.maxValue]);

  const handlePointHover = (e, point) => {
    const tooltip = document.createElement('div');
    tooltip.className = 'pie-tooltip';
    tooltip.innerHTML = `
      <div class="tooltip-category">${selectedPeriod === 'Este Ano' ? 'Mês' : selectedPeriod === 'Últimos 3 Meses' ? 'Semana' : 'Dia'} ${point.day}</div>
      <div class="tooltip-amount">R$ ${point.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
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
  };

  const handlePointLeave = (e) => {
    if (e.target.tooltip) {
      e.target.removeEventListener('mousemove', e.target.updatePosition);
      document.body.removeChild(e.target.tooltip);
      e.target.tooltip = null;
    }
  };

  return (
    <svg viewBox="0 0 400 200" className="line-svg" key={`chart-${selectedPeriod}-${data?.length || 0}`}>
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#EF4444" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#EF4444" stopOpacity="0"/>
        </linearGradient>
      </defs>
      
      {/* Eixo Y */}
      {yAxisLabels.map((label, i) => (
        <g key={i}>
          <line x1="40" y1={label.y} x2="380" y2={label.y} stroke="var(--border-color)" strokeWidth="0.5"/>
          <text x="35" y={label.y + 5} textAnchor="end" fontSize="10" fill="var(--text-secondary)">
            {label.label}
          </text>
        </g>
      ))}
      
      {/* Linha */}
      {chartData.points.length > 0 && (
        <polyline
          fill="none"
          stroke="#EF4444"
          strokeWidth="2"
          points={chartData.points.map(p => `${p.x},${p.y}`).join(' ')}
        />
      )}
      
      {/* Pontos */}
      {chartData.points.map((point, index) => (
        <circle
          key={`point-${index}-${point.day}`}
          cx={point.x}
          cy={point.y}
          r="3"
          fill="#EF4444"
          className="line-point"
          style={{ cursor: 'pointer' }}
          onMouseEnter={(e) => handlePointHover(e, point)}
          onMouseLeave={handlePointLeave}
        />
      ))}
      
      {/* Labels dos dias/períodos */}
      {chartData.points.map((point, index) => {
        if (chartData.points.length > 10 && index % Math.ceil(chartData.points.length / 8) !== 0) return null;
        return (
          <text
            key={`label-${index}-${point.day}`}
            x={point.x}
            y="195"
            textAnchor="middle"
            fontSize="8"
            fill="var(--text-secondary)"
          >
            {point.day}
          </text>
        );
      })}
    </svg>
  );
}