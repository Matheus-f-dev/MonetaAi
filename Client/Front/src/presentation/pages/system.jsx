
import "../styles/pages/System.css";

export default function System() {
  // -> estes dados serão trocados pelo seu backend depois
  const userName   = "Usuário";
  const balance    = -2000;
  const income     = 0;
  const expenses   = 2000;
  const salary     = 5000;
  const progress   = 40; // %

  const bills = [
    { name: "Netflix",  due: "25/07", amount: 39.90 },
    { name: "Aluguel",  due: "10/07", amount: 850.00 },
    { name: "Internet", due: "15/07", amount: 119.90 },
  ];

  const transactions = [
    { type: "out", desc: "alimentacao", category: "Outras", date: "2025-08-12", amount: -2000.00 },
    // adicione mais linhas do backend aqui
  ];

  const brl = (v) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="sys-layout">
      {/* ===== Sidebar ===== */}
      <aside className="sys-sidebar">
        <div className="sys-brand">MonetaAi</div>

        <div className="sys-side-group">
          <div className="sys-side-title">Menu Principal</div>
          <nav className="sys-side-nav">
            <SideItem label="Início" active icon={<HomeIcon />} />
            <SideItem label="Gastos" icon={<BagIcon />} />
            <SideItem label="Receitas" icon={<WalletIcon />} />
            <SideItem label="Análises" icon={<ChartIcon />} />
            <SideItem label="Relatórios" icon={<DocIcon />} />
            <SideItem label="Planejamento" icon={<PlanIcon />} />
            <SideItem label="Alertas" icon={<BellIcon />} />
            <SideItem label="Modo Viagem" icon={<PlaneIcon />} />
            <SideItem label="Simulador Chatbot" icon={<BotIcon />} />
            <SideItem label="Configurações" icon={<GearIcon />} />
          </nav>
        </div>

        <div className="sys-side-footer">
          <SideItem label="Meu Perfil" icon={<UserIcon />} />
          <SideItem label="Sair" icon={<ExitIcon />} />
        </div>
      </aside>

      {/* ===== Main ===== */}
      <main className="sys-main">
        {/* Topbar */}
        <header className="sys-topbar">
          <div className="sys-top-left">
            <h2>Olá, {userName}! <span className="sys-wave">👋</span></h2>
            <button className="sys-badge">Saldo Futuro</button>
          </div>
          <div className="sys-top-actions">
            <button className="sys-btn">❔ Tutorial</button>
            <button className="sys-btn sys-btn-primary">＋ Nova Transação</button>
          </div>
        </header>

        {/* Tabs */}
        <div className="sys-tabs">
          <button className="sys-tab sys-tab-active">Visão Geral</button>
          <button className="sys-tab">Saldo Futuro</button>
          <button className="sys-tab">Atividades</button>
        </div>

        {/* Painel principal (sem chatbot / sem lovable) */}
        <section className="sys-panel">
            {/* Tabs */}
        <div className="sys-tabs">
          <button className="sys-tab sys-tab-active">Visão Geral</button>
          <button className="sys-tab">Saldo Futuro</button>
          <button className="sys-tab">Atividades</button>
        </div>
          {/* KPIs */}
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
              <div className="sys-kpi-value">{brl(income)}</div>
              <div className="sys-small">Total acumulado</div>
            </div>

            <div className="sys-kpi sys-kpi-right">
              <div className="sys-kpi-title">Despesas</div>
              <div className="sys-kpi-value sys-danger">{brl(expenses)}</div>
              <div className="sys-small">Total acumulado</div>
            </div>
          </div>

          {/* Grid principal */}
          <div className="sys-grid">
            {/* Card: Gráfico */}
            <div className="sys-card sys-card-big">
              <div className="sys-card-head">
                <div>
                  <div className="sys-card-title">Visão Geral</div>
                  <div className="sys-small">Acompanhe suas receitas e despesas</div>
                </div>
                <div className="sys-segmented">
                  <button className="sys-seg sys-active">Semana</button>
                  <button className="sys-seg">Mês</button>
                  <button className="sys-seg">Ano</button>
                </div>
              </div>

              <div className="sys-chart">
                {[0,1,2,3,4].map(i=>(
                  <div key={i} className="sys-hline" style={{top:`${i*25}%`}} />
                ))}

                <svg viewBox="0 0 1000 220" className="sys-spark" aria-hidden>
                  <polyline
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="3"
                    points="0,180 80,178 160,178 240,179 320,178 400,179 480,178 560,178 640,178 720,178 800,176 880,175 960,40"
                  />
                  {[0,80,160,240,320,400,480,560,640,720,800,880,960].map((x,i)=>(
                    <circle key={i} cx={x} cy={i<12?178:40} r="4" fill="#ef4444" />
                  ))}
                </svg>

                <div className="sys-xlabels">
                  {["15/07","16/07","18/07","20/07","25/07","27/07","31/07","02/08","06/08","10/08","11/08","12/08"]
                    .map(d => <span key={d}>{d}</span>)}
                </div>
              </div>
            </div>

            {/* Lateral: Progresso + Próximas Contas */}
            <div className="sys-side">
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

              <div className="sys-card">
                <div className="sys-card-title">Próximas contas</div>
                <ul className="sys-bills">
                  {bills.map((b,i)=>(
                    <li key={i}>
                      <span className="sys-left"><span className="sys-cal">📅</span>{b.name}</span>
                      <span className="sys-right">
                        <span className="sys-small">{b.due}</span> <b>{brl(b.amount)}</b>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Tabela de Transações (sem Chatbot ao lado) */}
          <div className="sys-card sys-table">
            <div className="sys-card-title">Transações Recentes</div>
            <div className="sys-small" style={{marginTop:4}}>Suas últimas 5 transações</div>

            <div className="sys-table-wrap">
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
                  {transactions.map((t,i)=>(
                    <tr key={i}>
                      <td>
                        <span className={`sys-tipo ${t.amount<0?"sys-neg":"sys-pos"}`}>
                          {t.amount<0?"–":"+"}
                        </span>
                      </td>
                      <td>{t.desc}</td>
                      <td><span className="sys-pill">{t.category}</span></td>
                      <td>{t.date}</td>
                      <td className={`sys-value ${t.amount<0?"sys-neg-t":"sys-pos-t"}`}>
                        {t.amount<0?"-":""}{brl(Math.abs(t.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}

/* ====== Subcomponentes e ícones (SVG inline, sem libs) ====== */
function SideItem({ icon, label, active=false }) {
  return (
    <a href="#" className={`sys-side-item ${active ? "sys-active" : ""}`}>
      <span className="sys-ico">{icon}</span>
      <span>{label}</span>
    </a>
  );
}

function HomeIcon(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>)}
function BagIcon(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 7h12l1.2 11.5A2 2 0 0 1 17.2 21H6.8A2 2 0 0 1 4.8 18.5L6 7Z" stroke="currentColor" strokeWidth="1.6"/><path d="M8 7V5a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="1.6"/></svg>)}
function WalletIcon(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M16 12h5" stroke="currentColor" strokeWidth="1.6" /><circle cx="16" cy="12" r="1.25" fill="currentColor"/></svg>)}
function ChartIcon(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.6"/><path d="M7 15l4-6 3 3 4-5" stroke="currentColor" strokeWidth="1.6" fill="none"/></svg>)}
function DocIcon(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.6"/><path d="M15 2v6h6" stroke="currentColor" strokeWidth="1.6"/></svg>)}
function PlanIcon(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M7 9h10M7 13h6" stroke="currentColor" strokeWidth="1.6"/></svg>)}
function BellIcon(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 8a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7" stroke="currentColor" strokeWidth="1.6"/><path d="M9.5 20a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.6"/></svg>)}
function PlaneIcon(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M10.5 21l1.5-6 7-7a2 2 0 0 0-2.8-2.8l-7 7-6 1.5 5 3L10.5 21Z" stroke="currentColor" strokeWidth="1.6" /></svg>)}
function BotIcon(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="8" width="18" height="10" rx="3" stroke="currentColor" strokeWidth="1.6"/><circle cx="9" cy="13" r="1.2" fill="currentColor"/><circle cx="15" cy="13" r="1.2" fill="currentColor"/><path d="M12 8V4" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="3" r="1.2" fill="currentColor"/></svg>)}
function GearIcon(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.6"/><path d="M19.4 15.5l1.6-2.7-1.6-2.7 0-3.1-3.1 0-2.7-1.6L10.9 4 8.2 5.6l-3.1 0 0 3.1L3.6 10.1l1.6 2.7 0 3.1 3.1 0 2.7 1.6 2.7-1.6 3.1 0z" stroke="currentColor" strokeWidth="1.2" opacity=".25"/></svg>)}
function UserIcon(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6"/><path d="M4 20a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.6"/></svg>)}
function ExitIcon(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" stroke="currentColor" strokeWidth="1.6"/><path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="1.6"/><path d="M21 12H9" stroke="currentColor" strokeWidth="1.6"/></svg>)}
