import { useState } from 'react';
//import '../../../src/App.css'; 
import '../styles/pages/Login.css';
import { Link } from 'react-router-dom';

export default function LoginCard() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    alert('Login enviado!');
    // Aqui você pode adicionar a lógica real de autenticação.
  }

  return (
    <div>
      <div className="login-card animate__animated animate__fadeInDown">
        <h2>
          Bem-vindo à <span><Link to="/" className="brand-name">Moneta</Link></span>
        </h2>
        <p>Seu dinheiro no controle, sua vida no comando.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            placeholder="seuemail@exemplo.com"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <label>Senha</label>
        <div className="password-wrapper">
  <input
    type={showPassword ? 'text' : 'password'}
    placeholder="Sua senha"
    required
    value={senha}
    onChange={e => setSenha(e.target.value)}
    className="password-input"
  />
  <button
    className="botao"
    type="button"
    tabIndex="-1"
    onClick={() => setShowPassword(s => !s)}
  >
    <img
      src="https://cdn-icons-png.flaticon.com/512/565/565655.png"
      alt="mostrar senha"
      className="icone-olho"
    />
  </button>
</div>


          <button type="submit" className="login-btn">
            Entrar
          </button>
        </form>

        <div className="footer-links">
          <Link to="/EsqueciSenha">Esqueci minha senha</Link>
          <Link to="/cadastro">Criar conta</Link>
        </div>
      </div>
    </div>
  );
}
