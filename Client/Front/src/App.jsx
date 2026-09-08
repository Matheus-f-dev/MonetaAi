import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import './App.css';
import './presentation/styles/pages/profile.css';
import './presentation/styles/pages/system-hovers.css';
// Fase 9: pages/system.jsx (a antiga tela de dashboard, dona deste
// import antes) foi removida -- mas o arquivo em si não é só CSS
// daquela tela. Define :root com as variáveis de tema (--bg, --card,
// --text, --line, --primary...) e as classes .sys-layout/.sys-sidebar/
// .sys-side-* que Profile.jsx, Agent.jsx e o Sidebar.jsx que os dois
// ainda usam continuam precisando (nenhum dos dois migrou pro AppShell
// ainda -- ficam pras Fases 7 e 8). Import direto aqui, mesmo padrão
// das duas linhas acima.
import './presentation/styles/pages/system.css';
import { useTheme } from './presentation/hooks/useTheme';
import { useBrandColor } from './app-shell/useBrandColor';
import { ProtectedRoute } from './presentation/components/ProtectedRoute';
import { ToastContainer } from './presentation/components/system/ToastContainer';
// Lazy: mantém a landing fora do bundle de quem só vai fazer login e usar o painel.
const LandingPage = lazy(() => import('./presentation/pages/Home'));
import LoginCard from './presentation/pages/Login';
import Cadastro from './presentation/pages/Register';
import RedefinirSenha from './presentation/pages/ChangePassword';
import Profile from './presentation/pages/Profile';
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
const AlertsPage = lazy(() => import('./features/alerts/AlertsPage'));
const AnalyticsPage = lazy(() => import('./features/insights/AnalyticsPage'));
const ReportsPage = lazy(() => import('./features/insights/ReportsPage'));
const ImpactoFinanceiroPage = lazy(() => import('./features/insights/ImpactoFinanceiroPage'));
const AgentPage = lazy(() => import('./features/agent/AgentPage'));

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
  // Chamado aqui (não só dentro de Profile.jsx, de onde o usuário
  // escolhe a cor) pra aplicar em toda rota, mesmo entrando direto numa
  // página que não passa por Profile primeiro -- ver o hook.
  useBrandColor();

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
                 da Fase 0). Fase 2 trouxe o dashboard; Fase 3 trouxe
                 Movimentações inteira (Gastos, Receitas, Gastos Fixos,
                 Receita Recorrente, Importar Extrato); Fase 4 traz
                 Patrimônio (Contas, Cartões, Orçamento, Metas) --
                 Contas e Cartões migram da camada 1 pra esta, Orçamento
                 e Metas são telas novas (backend já existia, sem UI);
                 Fase 5 traz Pessoas e Alertas -- Pessoas e Alertas
                 migram da camada 1, mais o NotificationsBell (Topbar,
                 visível em toda página do app novo) substituindo o
                 aviso de alerta disparado que só existia na tela de
                 dashboard antiga (fora de rota desde a Fase 2); Fase 6
                 traz Insights (Análises, Relatórios com exportação
                 CSV/PDF nova, Impacto Financeiro) -- os hooks que
                 calculam os dados continuam os mesmos, só a UI (e os
                 gráficos SVG desenhados à mão) trocam de identidade;
                 Fase 7 traz Automação (Agente de IA) -- migra da
                 camada 1, mesmo contrato de backend do widget antigo
                 (POST único por mensagem, sem streaming), só a casca
                 troca. Só falta Perfil (Fase 8) pra camada 1 zerar de
                 vez. */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />

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
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/impacto-financeiro" element={<ImpactoFinanceiroPage />} />
              <Route path="/agent" element={<AgentPage />} />
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
