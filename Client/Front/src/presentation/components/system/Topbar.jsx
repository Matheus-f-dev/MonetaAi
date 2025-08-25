export function Topbar({ userName }) {
  return (
    <header className="sys-topbar">
      <h2>Olá, {userName}! <span className="sys-wave">👋</span></h2>
      <button className="sys-btn sys-btn-primary">＋ Nova Transação</button>
    </header>
  );
}