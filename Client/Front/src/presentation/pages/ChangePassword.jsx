import { useState, useEffect } from 'react';
import '../styles/pages/Login.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Mark } from '../landing/ui/Icon';

/**
 * Compartilha estrutura e classes com Login.jsx/Register.jsx (mesmo
 * arquivo de estilo, Login.css) -- antes disso era uma terceira
 * identidade visual à parte (cartão azul-petróleo, botão verde-neon),
 * sem nenhuma relação com o resto do funil de autenticação nem com a
 * landing. Mesma lógica de sempre (useAuth.resetPassword), só a casca
 * some.
 */
export default function RedefinirSenha() {
  const [email, setEmail] = useState('');
  const [contador, setContador] = useState(0);
  const navigate = useNavigate();
  const { loading, message, resetPassword } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    const result = await resetPassword(email);

    if (result.success) {
      setContador(5);
    }
  }

  useEffect(() => {
    if (contador > 0) {
      const timer = setTimeout(() => setContador(contador - 1), 1000);
      return () => clearTimeout(timer);
    } else if (contador === 0 && message.includes('enviado')) {
      navigate('/login');
    }
  }, [contador, message, navigate]);

  return (
    <div className="auth-layout">
      <aside className="auth-visual">
        <div className="auth-brand">
          <Mark size={22} className="auth-brand-mark" />
          <span>Moneta</span>
        </div>

        <div className="auth-visual-copy">
          <h1>Recuperar acesso é rápido.</h1>
          <p>Manda um link de redefinição pro seu e-mail — sem precisar decorar senha nova até estar pronto pra trocar.</p>
        </div>

        <div className="auth-visual-proof">
          <div><b>9</b><span>áreas do produto</span></div>
          <div><b>50+</b><span>funcionalidades</span></div>
          <div><b>R$ 0</b><span>pra usar</span></div>
        </div>
      </aside>

      <div className="auth-form-side">
        <div className="login-card">
          <Link to="/login" className="back-link">← Voltar ao login</Link>

          <h2>Redefinir <span className="brand-name">senha</span></h2>
          <p>Digite o e-mail da sua conta -- mandamos um link de redefinição pra ele.</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <label>Email</label>
            <input
              type="email"
              placeholder="seuemail@exemplo.com"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar link de redefinição'}
            </button>

            {message && (
              <p id="mensagem" style={{ color: message.includes('enviado') ? 'var(--auth-pos)' : 'var(--auth-neg)' }}>
                {message}
                {contador > 0 && <br />}
                {contador > 0 && `Redirecionando para login em ${contador} segundos...`}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
