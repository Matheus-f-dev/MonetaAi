import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
// Redesign pós-login: tokens são globais (custom properties com nomes
// novos, não colidem com as antigas); os estilos de base ficam escopados
// em .ds-scope pra não vazar na landing enquanto o legado ainda existe.
import './styles/tokens.css';
import './styles/global.css';
//import './index.css';

// Instância única do cliente de cache -- decisão da Fase 0 (data fetching
// via TanStack Query em vez de useState+fetch por página). staleTime > 0
// de propósito: dado financeiro não muda a cada segundo, e sem isso toda
// troca de aba/foco na janela dispara refetch de tudo de novo.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
