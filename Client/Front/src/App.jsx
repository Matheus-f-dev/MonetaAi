import { Routes, Route, useLocation } from 'react-router-dom';
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
import System from './presentation/pages/system';
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

function AppRouter() {
  const location = useLocation();
  
  const renderComponent = () => {
    const currentPath = location.pathname;
    
    if (currentPath === '/') return <LandingPage />;
    
    // Rotas diretas
    switch (currentPath) {
      case '/login': return <LoginCard />;
      case '/cadastro': return <Cadastro />;
      case '/esqueci-senha': return <RedefinirSenha />;
      case '/system': return <System />;
      case '/expenses': return <Expenses />;
      case '/incomes': return <Incomes />;
      case '/cartoes': return <Cards />;
      case '/gastos-fixos': return <FixedExpenses />;
      case '/pessoas': return <People />;
      case '/contas': return <Contas />;
      case '/profile': return <Profile />;
      case '/alerts': return <Alerts />;
      case '/reports': return <Reports />;
      case '/analytics': return <Analytics />;
      case '/impacto-financeiro': return <ImpactoFinanceiro />;
      case '/agent': return <Agent />;
      case '/auth/callback': return <AuthCallback />;
      case '/privacy-policy': return <PrivacyPolicy />;
      case '/terms-of-service': return <TermsOfService />;
    }

    return <LandingPage />;
  };
  
  return (
    <ProtectedRoute>
      <Suspense fallback={null}>
        {renderComponent()}
      </Suspense>
    </ProtectedRoute>
  );
}

function App() {
  useTheme();
  
  return (
    <>
      <div className="background"></div>
      <Routes>
        <Route path="/*" element={<AppRouter />} />
      </Routes>
      <ToastContainer />
    </>
  );
}


export default App;
