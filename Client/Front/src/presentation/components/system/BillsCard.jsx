export function BillsCard({ bills }) {
  const brl = (v) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="sys-card">
      <div className="sys-card-title">Próximas contas</div>
      <ul className="sys-bills">
        {bills.map((b, i) => (
          <li key={i}>
            <span className="sys-left">
              <span className="sys-cal">📅</span>{b.name}
            </span>
            <span className="sys-right">
              <span className="sys-small">{b.due}</span> <b>{brl(b.amount)}</b>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}