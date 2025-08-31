export function Topbar({ userName, onNewTransaction }) {
  return (
    <header className="sys-topbar">
      <h2>Olá, {userName}! <span className="sys-wave">👋</span></h2>
      <button className="sys-btn sys-btn-primary" onClick={onNewTransaction}>＋ Nova Transação</button>
    </header>
  );
}