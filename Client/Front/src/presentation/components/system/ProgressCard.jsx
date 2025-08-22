export function ProgressCard({ progress, salary }) {
  const brl = (v) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="sys-card">
      <div className="sys-card-title">Progresso do mês</div>
      <div className="sys-small">
        Você já gastou <b>{progress.toFixed(1)}%</b> do seu salário de {brl(salary)}
      </div>

      <div className="sys-progress">
        <div className="sys-progress-bar" style={{ width: `${progress}%` }} />
        <div className="sys-progress-label">{progress.toFixed(1)}%</div>
      </div>
    </div>
  );
}