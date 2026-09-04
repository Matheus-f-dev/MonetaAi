# Componentes do Sistema (legado)

Esta pasta guardava os componentes da antiga tela de dashboard
(`pages/system.jsx`). Essa página saiu de rota na Fase 2 do redesign
(substituída por `features/dashboard/DashboardPage.tsx`) e foi removida
de vez na Fase 9, junto com os componentes que só ela usava.

O que sobra aqui ainda está em uso de verdade — por `Agent.jsx` e
`Profile.jsx`, as duas únicas páginas que ainda não migraram pro
AppShell novo (ficam para as Fases 7 e 8):

- **Sidebar** / **SideItem**: navegação lateral dessas páginas antigas.
- **Toast** / **ToastContainer**: sistema de notificação usado pelo
  app inteiro, novo e antigo (`ToastContainer` fica montado em
  `App.jsx`).
- **AgentChat**: chat do Agente de IA, usado por `Agent.jsx`.
- **Icons**: ícones SVG compartilhados pelo que sobrou aqui.

Nenhuma tela nova do redesign deve importar desta pasta -- o
design system (`src/design-system`) e os componentes de cada feature
(`src/features/*`) são a base a partir da Fase 0.
