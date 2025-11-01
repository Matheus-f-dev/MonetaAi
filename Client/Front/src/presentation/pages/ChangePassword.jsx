import { useState, useEffect } from 'react';
import '../styles/pages/ChangePassword.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

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
    <div className="container">
      <div className="cards">
        <h1>
          Redefinir <span>Senha</span>
        </h1>
        <p>Insira seu e-mail para redefinir sua senha.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            placeholder="seuemail@exemplo.com"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar link de redefinição'}
          </button>

          {message && (
            <p style={{
              textAlign: 'center',
              marginTop: 10,
              color: message.includes('enviado') ? 'green' : 'red'
            }}>
              {message}
              {contador > 0 && <br />}
              {contador > 0 && `Redirecionando para login em ${contador} segundos...`}
            </p>
          )}

          <div className="links">
            <Link to="/login">Voltar ao login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
