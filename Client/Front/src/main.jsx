import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './presentation/styles/base/_variables.css';
// Redesign pós-login: tokens são globais (custom properties com nomes
// novos, não colidem com as antigas); os estilos de base ficam escopados
// em .ds-scope pra não vazar na landing enquanto o legado ainda existe.
import './styles/tokens.css';
import './styles/global.css';
//import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
