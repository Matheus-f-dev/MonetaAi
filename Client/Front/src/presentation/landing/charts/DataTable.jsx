// Gêmea em tabela de todo gráfico. Existe por dois motivos: leitor de tela e
// quem simplesmente quer o número exato. Tooltip nunca é o único caminho até
// um valor.
//
// `hidden` deixa a tabela apenas para tecnologia assistiva, sem o disclosure
// visível. Usado onde um <details> aberto atrapalharia a composição, como
// dentro do painel do hero.
export default function DataTable({ caption, head, rows, hidden = false }) {
  const table = (
    <table className="mn-dt">
      <caption className="mn-sr">{caption}</caption>
      <thead>
        <tr>
          {head.map((h, i) => (
            <th key={h} scope="col" className={i === 0 ? '' : 'mn-dt__n'}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row[0]}>
            <th scope="row">{row[0]}</th>
            {row.slice(1).map((cell, i) => (
              <td key={`${row[0]}-${i}`} className="mn-dt__n mn-num">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  if (hidden) return <div className="mn-sr">{table}</div>;

  return (
    <details className="mn-dt-wrap">
      <summary className="mn-mono mn-dt-sum">Ver dados em tabela</summary>
      <div className="mn-dt-scroll">{table}</div>
    </details>
  );
}
