// Fase 9 -- limpo dos componentes que só a antiga tela de dashboard
// (pages/system.jsx, sem rota desde a Fase 2) usava. O que sobra aqui
// ainda é usado de verdade por Agent.jsx e Profile.jsx, que só migram
// pro AppShell nas Fases 7 e 8.
export { Sidebar } from './Sidebar';
export { Toast } from './Toast';
export { ToastContainer } from './ToastContainer';
export * from './Icons';
export { default as AgentChat } from './AgentChat';
