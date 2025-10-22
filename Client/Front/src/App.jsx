import { Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import './presentation/styles/pages/profile.css';
import './presentation/styles/pages/system-hovers.css';
import { useTheme } from './presentation/hooks/useTheme';
import { ProtectedRoute } from './presentation/components/ProtectedRoute';
import { decryptRoute } from './shared/urlCrypto';
import { ToastContainer } from './presentation/components/system/ToastContainer';
import LandingPage from './presentation/pages/Home';
import LoginCard from './presentation/pages/Login';
import Cadastro from './presentation/pages/Register';
import RedefinirSenha from './presentation/pages/ChangePassword';
import System from './presentation/pages/system';
import Expenses from './presentation/pages/Expenses';
import Incomes from './presentation/pages/Incomes';
import Profile from './presentation/pages/Profile';
import Alerts from './presentation/pages/Alerts';
import Reports from './presentation/pages/Reports';
import Analytics from './presentation/pages/Analytics';
import ImpactoFinanceiro from './presentation/pages/ImpactoFinanceiro';
import AuthCallback from './presentation/pages/AuthCallback';

function AppRouter() {
  const location = useLocation();
  
  const renderComponent = () => {
    const currentPath = location.pathname;
    
    if (currentPath === '/') return <LandingPage />;
    
    if (currentPath.startsWith('/app/')) {
      const decryptedRoute = decryptRoute(currentPath);
      
      switch (decryptedRoute) {
        case '/login': return <LoginCard />;
        case '/cadastro': return <Cadastro />;
        case '/esqueci-senha': return <RedefinirSenha />;
        case '/system': return <System />;
        case '/expenses': return <Expenses />;
        case '/incomes': return <Incomes />;
        case '/profile': return <Profile />;
        case '/alerts': return <Alerts />;
        case '/reports': return <Reports />;
        case '/analytics': return <Analytics />;
        case '/impacto-financeiro': return <ImpactoFinanceiro />;
        case '/auth/callback': return <AuthCallback />;
        default: return <LandingPage />;
      }
    }
    
    return <LandingPage />;
  };
  
  return (
    <ProtectedRoute>
      {renderComponent()}
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
