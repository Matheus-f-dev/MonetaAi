import { useState, useEffect } from 'react';
import '../styles/pages/Login.css';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSecureNavigation } from '../hooks/useSecureNavigation';
import { ValidationContext, EmailValidation, PasswordValidation } from '../../core/services/ValidationStrategy';
import { useToast } from '../hooks/useToast';
import { useTerms } from '../hooks/useTerms';
import TermsModal from '../components/TermsModal';

export default function LoginCard() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { secureNavigate } = useSecureNavigation();
  const [searchParams] = useSearchParams();
  const { loading, message, login, googleLogin } = useAuth();
  const { addToast } = useToast();
  const { termsAccepted, showTermsModal, acceptTerms, declineTerms, showTerms } = useTerms();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      // Handle error from URL params
    }
  }, [searchParams]);

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!termsAccepted) {
      showTerms();
      return;
    }
    
    // Strategy - validar email e senha
    const emailValidator = new ValidationContext(new EmailValidation());
    const passwordValidator = new ValidationContext(new PasswordValidation());
    
    const emailValidation = emailValidator.validate(email);
    const passwordValidation = passwordValidator.validate(senha);
    
    if (!emailValidation.isValid) {
      addToast(emailValidation.message, 'error');
      return;
    }
    
    if (!passwordValidation.isValid) {
      addToast(passwordValidation.message, 'error');
      return;
    }
    
    const result = await login(email, senha);

    if (result.success) {
      secureNavigate('/system');
    }
  }

  return (
    <div className="auth-layout">
      <TermsModal
        isOpen={showTermsModal}
        onAccept={acceptTerms}
        onDecline={declineTerms}
      />

      <aside className="auth-visual">
        <div className="auth-brand">
          <span className="auth-brand-mark">M</span>
          <span>Moneta</span>
        </div>

        <div className="auth-visual-copy">
          <h1>Sua vida financeira, sem abrir planilha.</h1>
          <p>Registra pelo WhatsApp, categoriza sozinha e mantém o saldo de todas as suas contas e cartões sempre certo.</p>
        </div>

        <div className="auth-visual-proof">
          <div><b>9</b><span>áreas do produto</span></div>
          <div><b>50+</b><span>funcionalidades</span></div>
          <div><b>R$ 0</b><span>pra usar</span></div>
        </div>
      </aside>

      <div className="auth-form-side">
      <div className="login-card">
        <Link to="/" className="back-link">← Voltar ao início</Link>
        <h2>
          Bem-vindo à <span className="brand-name">Moneta</span>
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
            onClick={googleLogin}
            disabled={loading}
          >
            <img 
              src="https://developers.google.com/identity/images/g-logo.png" 
              alt="Google" 
              className="google-icon"
            />
            Entrar com Google
          </button>
          
          <p id="mensagem" style={{
            color: message.includes('sucesso') ? '#1f6e46' : '#d2401f'
          }}>{message}</p>
        </form>

        <div className="footer-links">
          <button onClick={() => secureNavigate('/esqueci-senha')} className="link-btn">Esqueci minha senha</button>
          <button onClick={() => secureNavigate('/cadastro')} className="link-btn">Criar conta</button>
        </div>
      </div>
      </div>
    </div>
  );
}
