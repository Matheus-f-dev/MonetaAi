export function ProgressCard({ progress, salary, monthlyExpenses }) {
  const brl = (v) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Definir cor da barra baseada na porcentagem
  const getProgressColor = (percentage) => {
    if (percentage <= 50) return '#16a34a'; // Verde
    if (percentage <= 75) return '#f59e0b'; // Amarelo
    if (percentage <= 90) return '#f97316'; // Laranja
    return '#ef4444'; // Vermelho
  };

  const progressColor = getProgressColor(progress);

  return (
    <div className="sys-card">
      <div className="sys-card-title">Progresso do mês</div>
      <div className="sys-small">
        Você já gastou <b>{brl(monthlyExpenses)}</b> ({progress.toFixed(1)}%) do seu salário de {brl(salary)}
      </div>

      <div className="sys-progress">
        <div 
          className="sys-progress-bar" 
          style={{ 
            width: `${Math.min(progress, 100)}%`,
            backgroundColor: progressColor
          }} 
        />
        <div className="sys-progress-label">{progress.toFixed(1)}%</div>
      </div>
      
      {progress > 100 && (
        <div className="sys-small" style={{ color: '#ef4444', marginTop: '8px' }}>
          ⚠️ Você excedeu seu orçamento em {brl(monthlyExpenses - salary)}
        </div>
      )}
    </div>
  );
}