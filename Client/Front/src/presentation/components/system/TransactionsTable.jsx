export function TransactionsTable({ transactions }) {
  const brl = (v) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="sys-card sys-table">
      <div className="sys-card-title">Transações Recentes</div>
      <div className="sys-small" style={{ marginTop: 4 }}>
        Suas últimas 5 transações
      </div>

      <div className="sys-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Data</th>
              <th style={{ textAlign: "right" }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t, i) => (
              <tr key={i}>
                <td>
                  <span className={`sys-tipo ${t.amount < 0 ? "sys-neg" : "sys-pos"}`}>
                    {t.amount < 0 ? "–" : "+"}
                  </span>
                </td>
                <td>{t.desc}</td>
                <td>
                  <span className="sys-pill">{t.category}</span>
                </td>
                <td>{t.date}</td>
                <td className={`sys-value ${t.amount < 0 ? "sys-neg-t" : "sys-pos-t"}`}>
                  {t.amount < 0 ? "-" : ""}{brl(Math.abs(t.amount))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}