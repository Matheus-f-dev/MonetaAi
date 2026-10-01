import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import './App.css';
import { useBrandColor } from './app-shell/useBrandColor';
import { useFontPreference } from './app-shell/useFontPreference';
import { ProtectedRoute } from './presentation/components/ProtectedRoute';
import { ToastContainer } from './presentation/components/system/ToastContainer';
// Lazy: mantém a landing fora do bundle de quem só vai fazer login e usar o painel.
const LandingPage = lazy(() => import('./presentation/pages/Home'));
import LoginCard from './presentation/pages/Login';
import Cadastro from './presentation/pages/Register';
import RedefinirSenha from './presentation/pages/ChangePassword';
import AuthCallback from './presentation/pages/AuthCallback';
import PrivacyPolicy from './presentation/pages/legal/PrivacyPolicy';
import TermsOfService from './presentation/pages/legal/TermsOfService';
import { AppShell } from './app-shell/AppShell';
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage'));
const ExpensesPage = lazy(() => import('./features/movements/ExpensesPage'));
const IncomesPage = lazy(() => import('./features/movements/IncomesPage'));
const FixedExpensesPage = lazy(() => import('./features/movements/FixedExpensesPage'));
const FixedIncomesPage = lazy(() => import('./features/movements/FixedIncomesPage'));
const ImportStatementPage = lazy(() => import('./features/movements/ImportStatementPage'));
const ContasPage = lazy(() => import('./features/wealth/ContasPage'));
const CartoesPage = lazy(() => import('./features/wealth/CartoesPage'));
const OrcamentoPage = lazy(() => import('./features/wealth/OrcamentoPage'));
const MetasPage = lazy(() => import('./features/wealth/MetasPage'));
const PessoasPage = lazy(() => import('./features/people/PessoasPage'));
const RachadinhaPage = lazy(() => import('./features/people/RachadinhaPage'));
const AlertsPage = lazy(() => import('./features/alerts/AlertsPage'));
const AnalyticsPage = lazy(() => import('./features/insights/AnalyticsPage'));
const ReportsPage = lazy(() => import('./features/insights/ReportsPage'));
const ImpactoFinanceiroPage = lazy(() => import('./features/insights/ImpactoFinanceiroPage'));
const AgentPage = lazy(() => import('./features/agent/AgentPage'));
const ProfilePage = lazy(() => import('./features/profile/ProfilePage'));

// Catálogo do design system: a atribuição inteira fica atrás de
// import.meta.env.DEV, que o Vite substitui por `false` no build --
// aí o Rollup elimina o ramo morto e o import() dinâmico junto, e a
// página não vai parar no bundle de produção. Guardar só o ponto de
// render não bastava: o chunk continuava sendo gerado.
const DesignSystemPage = import.meta.env.DEV
  ? lazy(() => import('./design-system/pages/DesignSystemPage'))
  : null;

function App() {
  // Cor de destaque e fonte/tamanho de fonte -- aplicados aqui (não só
  // dentro de ProfilePage, de onde o usuário escolhe) pra valer em toda
  // rota, mesmo entrando direto numa página que não passa pelo Perfil
  // primeiro. Tema (claro/escuro/sistema) é o próprio useAppTheme, já
  // chamado dentro do AppShell -- não precisa de novo aqui.
  useBrandColor();
  useFontPreference();

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
              pra árvore de rotas real, ver o arquivo). Todas as rotas daqui
              pra baixo já são filhas do <AppShell/> (sidebar/topbar novos,
              tema, os 7 grupos de navegação da Fase 0) -- a camada 1
              (páginas com layout próprio, fora do AppShell) que existia
              nas Fases 1-7 zerou na Fase 8 (Perfil foi a última: Fase 2
              trouxe o dashboard, Fase 3 Movimentações inteira, Fase 4
              Patrimônio, Fase 5 Pessoas/Alertas, Fase 6 Insights, Fase 7
              Automação, Fase 8 Perfil). `.sys-layout`/Sidebar antiga/
              useTheme.js não têm mais nenhum renderer no app -- saíram
              junto (ver commit desta fase). */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/system" element={<DashboardPage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/incomes" element={<IncomesPage />} />
              <Route path="/gastos-fixos" element={<FixedExpensesPage />} />
              <Route path="/receita-recorrente" element={<FixedIncomesPage />} />
              <Route path="/importar-extrato" element={<ImportStatementPage />} />
              <Route path="/contas" element={<ContasPage />} />
              <Route path="/cartoes" element={<CartoesPage />} />
              <Route path="/orcamento" element={<OrcamentoPage />} />
              <Route path="/metas" element={<MetasPage />} />
              <Route path="/pessoas" element={<PessoasPage />} />
              <Route path="/rachadinha" element={<RachadinhaPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/impacto-financeiro" element={<ImpactoFinanceiroPage />} />
              <Route path="/agent" element={<AgentPage />} />
              <Route path="/profile" element={<ProfilePage />} />
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
