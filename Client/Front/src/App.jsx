import { Routes, Route } from 'react-router-dom';
import './App.css';
import LandingPage from './presentation/pages/Home';
import LoginCard from './presentation/pages/Login';
import Cadastro from './presentation/pages/Register';
import RedefinirSenha from './presentation/pages/ChangePassword';
import System from './presentation/pages/system';
import AuthCallback from './presentation/pages/AuthCallback';

function App() {
  return (
    <>
      <div className="background"></div>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginCard />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/esqueci-senha" element={<RedefinirSenha />} />
        <Route path="/system" element={<System />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
    </>
  );
}


export default App;
