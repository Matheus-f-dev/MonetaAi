import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import './App.css';
import './presentation/styles/pages/profile.css';
import './presentation/styles/pages/system-hovers.css';
import { useTheme } from './presentation/hooks/useTheme';
import { ProtectedRoute } from './presentation/components/ProtectedRoute';
import { ToastContainer } from './presentation/components/system/ToastContainer';
// Lazy: mantém a landing fora do bundle de quem só vai fazer login e usar o painel.
const LandingPage = lazy(() => import('./presentation/pages/Home'));
import LoginCard from './presentation/pages/Login';
import Cadastro from './presentation/pages/Register';
import RedefinirSenha from './presentation/pages/ChangePassword';
import Expenses from './presentation/pages/Expenses';
import Incomes from './presentation/pages/Incomes';
import Cards from './presentation/pages/Cards';
import FixedExpenses from './presentation/pages/FixedExpenses';
import People from './presentation/pages/People';
import Contas from './presentation/pages/Contas';
import Profile from './presentation/pages/Profile';
import Alerts from './presentation/pages/Alerts';
import Reports from './presentation/pages/Reports';
import Analytics from './presentation/pages/Analytics';
import ImpactoFinanceiro from './presentation/pages/ImpactoFinanceiro';
import Agent from './presentation/pages/Agent';
import AuthCallback from './presentation/pages/AuthCallback';
import PrivacyPolicy from './presentation/pages/legal/PrivacyPolicy';
import TermsOfService from './presentation/pages/legal/TermsOfService';
import { AppShell } from './app-shell/AppShell';
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage'));

// Catálogo do design system: a atribuição inteira fica atrás de
// import.meta.env.DEV, que o Vite substitui por `false` no build --
// aí o Rollup elimina o ramo morto e o import() dinâmico junto, e a
// página não vai parar no bundle de produção. Guardar só o ponto de
// render não bastava: o chunk continuava sendo gerado.
const DesignSystemPage = import.meta.env.DEV
  ? lazy(() => import('./design-system/pages/DesignSystemPage'))
  : null;

function App() {
  // Legado, ainda em uso -- aplica data-theme/data-color-scheme no
  // `.sys-layout` de cada página antiga não redesenhada (a maioria do
  // app, ainda). O tema do redesign (useAppTheme, dentro do AppShell)
  // é independente disso e escreve no <html>, não no `.sys-layout` --
  // os dois convivem sem conflito até a última página antiga sumir.
  useTheme();

  return (
    <>
      <div className="background"></div>
      <Suspense fallback={null}>
        <Routes>
          {/* Público -- sem sessão, sem shell. */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginCard />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/esqueci-senha" element={<RedefinirSenha />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />

          {/* Protegido -- <ProtectedRoute/> é a guarda (Fase 1: adaptada
              pra árvore de rotas real, ver o arquivo). Duas camadas:

              1) Páginas ainda não redesenhadas -- guardadas, mas com o
                 próprio layout/sidebar interno intacto (ver decisão da
                 Fase 1 no resumo: forçar o AppShell novo nelas sem
                 reconstruir o conteúdo arriscava quebrar CSS acoplado
                 de um app em produção, tipo `.sys-layout .sys-topbar{
                 position: absolute }`). Migram pro AppShell quando a
                 própria fase reconstrói a tela.

              2) Páginas já na identidade nova -- filhas do <AppShell/>
                 (sidebar/topbar novos, tema, os 7 grupos de navegação
                 da Fase 0). Fase 2 traz o dashboard (/system) como
                 primeira página de produto de verdade. */}
          <Route element={<ProtectedRoute />}>
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/incomes" element={<Incomes />} />
            <Route path="/cartoes" element={<Cards />} />
            <Route path="/gastos-fixos" element={<FixedExpenses />} />
            <Route path="/pessoas" element={<People />} />
            <Route path="/contas" element={<Contas />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/impacto-financeiro" element={<ImpactoFinanceiro />} />
            <Route path="/agent" element={<Agent />} />

            <Route element={<AppShell />}>
              <Route path="/system" element={<DashboardPage />} />
              {import.meta.env.DEV && <Route path="/design-system" element={<DesignSystemPage />} />}
            </Route>
          </Route>

          {/* Qualquer coisa fora daqui (URL digitada errada, link velho) -- home,
              nunca uma tela em branco. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <ToastContainer />
    </>
  );
}

export default App;
