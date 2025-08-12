import '../styles/pages/system.css';
import { Link } from 'react-router-dom';
export default function Dashboard(){
  return (
    <section className="container">
      <div className="panel">

        {/* Linha superior de KPIs */}
        <div className="kpis">
          <div className="kpi">
            <div className="kpi-title">Saldo Atual</div>
            <div className="kpi-sub small">Atualizado em tempo real</div>
            <div className="kpi-value danger">R$ -2000.00</div>
          </div>

          <div className="kpi mid">
            <div className="kpi-title">Receitas</div>
            <div className="kpi-value">R$ 0.00</div>
            <div className="kpi-sub small">Total acumulado</div>
          </div>

          <div className="kpi right">
            <div className="kpi-title">Despesas</div>
            <div className="kpi-value danger">R$ 2000.00</div>
            <div className="kpi-sub small">Total acumulado</div>
          </div>
        </div>

        {/* Conteúdo principal: gráfico + progresso + próximas contas */}
        <div className="grid-main">
          <div className="card big">
            <div className="card-head">
              <div>
                <div className="card-title">Visão Geral</div>
                <div className="small">Acompanhe suas receitas e despesas</div>
              </div>
              <div className="segmented">
                <button className="seg active">Semana</button>
                <button className="seg">Mês</button>
                <button className="seg">Ano</button>
              </div>
            </div>

            <div className="chart">
              {/* Linhas horizontais */}
              {Array.from({length:5}).map((_,i)=>(
                <div key={i} className="hline" style={{top:`${(i)*25}%`}} />
              ))}

              {/* Eixo X labels (mock) */}
              <div className="xlabels">
                {["15/07","16/07","18/07","20/07","25/07","27/07","31/07","02/08","06/08","10/08","11/08","12/08"].map((d)=>(
                  <span key={d}>{d}</span>
                ))}
              </div>

              {/* Sparkline simples em SVG (flat e pico no fim) */}
              <svg viewBox="0 0 1000 220" className="spark">
                <polyline
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3"
                  points="
                    0,180 80,178 160,178 240,179 320,178 400,179 480,178 560,178 640,178 720,178
                    800,176 880,175 960,40
                  "
                />
                { [0,80,160,240,320,400,480,560,640,720,800,880,960].map((x,i)=>(
                  <circle key={i} cx={x} cy={i<12?178:40} r="4" fill="#ef4444" />
                )) }
              </svg>
            </div>
          </div>

          <div className="side">
            <div className="card">
              <div className="card-title">Progresso do mês</div>
              <div className="small">Você já gastou <b>40.0%</b> do seu salário de R$ 5000.00</div>

              <div className="progress">
                <div className="progress-bar" style={{width:"40%"}} />
                <div className="progress-label">40.0%</div>
              </div>
            </div>

            <div className="card">
              <div className="card-title">Próximas contas</div>
              <ul className="bills">
                <li>
                  <span className="left">
                    <span className="cal">📅</span> Netflix
                  </span>
                  <span className="right">
                    <span className="small">25/07</span> <b>R$ 39,90</b>
                  </span>
                </li>
                <li>
                  <span className="left">
                    <span className="cal">📅</span> Aluguel
                  </span>
                  <span className="right">
                    <span className="small">10/07</span> <b>R$ 850,00</b>
                  </span>
                </li>
                <li>
                  <span className="left">
                    <span className="cal">📅</span> Internet
                  </span>
                  <span className="right">
                    <span className="small">15/07</span> <b>R$ 119,90</b>
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tabela de transações (sem chatbot ao lado) */}
        <div className="card table">
          <div className="card-title">Transações Recentes</div>
          <div className="small" style={{marginTop:4}}>Suas últimas 5 transações</div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Data</th>
                  <th style={{textAlign:"right"}}>Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <span className="tipo negative">–</span>
                  </td>
                  <td>alimentacao</td>
                  <td><span className="pill">Outras</span></td>
                  <td>2025-08-12</td>
                  <td className="value negative">-R$ 2000.00</td>
                </tr>
                {/* linhas futuras do backend aqui */}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
}
