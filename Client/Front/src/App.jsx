import { Routes, Route } from 'react-router-dom';
import './App.css';
import './presentation/styles/pages/profile.css';
import './presentation/styles/pages/system-hovers.css';
import { useTheme } from './presentation/hooks/useTheme';
import LandingPage from './presentation/pages/Home';
import LoginCard from './presentation/pages/Login';
import Cadastro from './presentation/pages/Register';
import RedefinirSenha from './presentation/pages/ChangePassword';
import System from './presentation/pages/system';
import Expenses from './presentation/pages/Expenses';
import Incomes from './presentation/pages/Incomes';
import Profile from './presentation/pages/Profile';
import AuthCallback from './presentation/pages/AuthCallback';

function App() {
  useTheme();
  
  return (
    <>
      <div className="background"></div>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginCard />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/esqueci-senha" element={<RedefinirSenha />} />
        <Route path="/system" element={<System />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/incomes" element={<Incomes />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
    </>
  );
}


export default App;
