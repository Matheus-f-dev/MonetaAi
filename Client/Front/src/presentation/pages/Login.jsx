import { useState, useEffect } from 'react';
//import '../../../src/App.css'; 
import '../styles/pages/Login.css';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

export default function LoginCard() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      setMensagem(error);
    }
  }, [searchParams]);

  function handleGoogleLogin() {
    window.location.href = 'http://localhost:3000/auth/google';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMensagem('');

    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        setMensagem('Login realizado com sucesso!');
        setTimeout(() => {
          navigate('/system');
        }, 1000);
      } else {
        setMensagem(data.message);
      }
    } catch (error) {
      setMensagem('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
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
            className='email-input'
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


          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
          
          <div className="divider">
            <span>ou</span>
          </div>
          
          <button 
            type="button" 
            className="google-login-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <img 
              src="https://developers.google.com/identity/images/g-logo.png" 
              alt="Google" 
              className="google-icon"
            />
            Entrar com Google
          </button>
          
          <p style={{ 
            textAlign: 'center', 
            marginTop: 10,
            color: mensagem.includes('sucesso') ? 'green' : 'red'
          }}>{mensagem}</p>
        </form>

        <div className="footer-links">
          <Link to="/esqueci-senha">Esqueci minha senha</Link>
          <Link to="/cadastro">Criar conta</Link>
        </div>
      </div>
    </div>
  );
}
