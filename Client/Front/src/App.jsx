import { Routes, Route } from 'react-router-dom';
import './App.css';
import LandingPage from './presentation/pages/Home';
import LoginCard from './presentation/pages/Login';
import Cadastro from './presentation/pages/Register';
import RedefinirSenha from './presentation/pages/ChangePassword';
import System from './presentation/pages/system';

function App() {
  return (
    <>
      <div className="background"></div>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginCard />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/EsqueciSenha" element={<RedefinirSenha />} />
        <Route path="/system" element={<System />} />
      </Routes>
    </>
  );
}


export default App;
