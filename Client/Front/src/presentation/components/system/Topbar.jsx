export function Topbar({ userName }) {
  return (
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
  );
}