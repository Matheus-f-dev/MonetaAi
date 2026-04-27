import { useTheme } from '../hooks/useTheme';
import { Sidebar } from '../components/system';
import AgentChat from '../components/system/AgentChat';
import '../styles/pages/Agent.css';

export default function Agent() {
  useTheme();

  return (
    <div className="agent-page">
      <Sidebar />
      <main className="agent-page__main">
        <div className="agent-page__header">
          <h1 className="agent-page__title">Moneta AI</h1>
          <p className="agent-page__subtitle">
            Assistente financeiro inteligente — registre gastos, veja relatórios e receba dicas de economia conversando naturalmente.
          </p>
        </div>
        <div className="agent-page__chat-wrapper">
          <AgentChat />
        </div>
      </main>
    </div>
  );
}
