# Componentes do Sistema (legado)

Esta pasta guardava os componentes da antiga tela de dashboard
(`pages/system.jsx`). Essa página saiu de rota na Fase 2 do redesign
(substituída por `features/dashboard/DashboardPage.tsx`) e foi removida
de vez na Fase 9, junto com os componentes que só ela usava.

O que sobra aqui ainda está em uso de verdade — só por `Profile.jsx`,
a última página que ainda não migrou pro AppShell novo (fica para a
Fase 8; `Agent.jsx`/`AgentChat` migraram na Fase 7 e saíram daqui):

- **Sidebar** / **SideItem**: navegação lateral de `Profile.jsx`.
- **Toast** / **ToastContainer**: sistema de notificação usado pelo
  app inteiro, novo e antigo (`ToastContainer` fica montado em
  `App.jsx`).
- **Icons**: ícones SVG usados pelo Sidebar acima.

Nenhuma tela nova do redesign deve importar desta pasta -- o
design system (`src/design-system`) e os componentes de cada feature
(`src/features/*`) são a base a partir da Fase 0.
