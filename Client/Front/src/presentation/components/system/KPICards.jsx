export function KPICards({ balance, income, expenses }) {
  const brl = (v) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="sys-kpis">
      <div className="sys-kpi">
        <div className="sys-kpi-title">Saldo Atual</div>
        <div className="sys-small">Atualizado em tempo real</div>
        <div className={`sys-kpi-value ${balance < 0 ? "sys-danger" : "sys-success"}`}>
          {brl(balance)}
        </div>
      </div>

      <div className="sys-kpi sys-kpi-mid">
        <div className="sys-kpi-title">Receitas</div>
        <div className="sys-kpi-value sys-success">{brl(income)}</div>
        <div className="sys-small">Total acumulado</div>
      </div>

      <div className="sys-kpi sys-kpi-right">
        <div className="sys-kpi-title">Despesas</div>
        <div className="sys-kpi-value sys-danger">{brl(expenses)}</div>
        <div className="sys-small">Total acumulado</div>
      </div>
    </div>
  );
}