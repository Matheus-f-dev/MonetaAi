# Componentes do Sistema (legado)

Esta pasta guardava os componentes da antiga tela de dashboard
(`pages/system.jsx`). Essa página saiu de rota na Fase 2 do redesign
(substituída por `features/dashboard/DashboardPage.tsx`), e o restante
saiu aos poucos conforme cada página que ainda dependia dele migrou pro
AppShell -- `Sidebar`/`SideItem`/`Icons` (navegação da antiga
`Agent.jsx`/`Profile.jsx`) saíram na Fase 8, quando Perfil (a última)
migrou.

O que sobra aqui é usado pelo app inteiro, novo e antigo:

- **Toast** / **ToastContainer**: sistema de notificação (`ToastContainer`
  fica montado em `App.jsx`).

Nenhuma tela nova do redesign deve importar desta pasta -- o
design system (`src/design-system`) e os componentes de cada feature
(`src/features/*`) são a base a partir da Fase 0.
