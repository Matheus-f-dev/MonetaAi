import { useState, useEffect } from 'react';
//import '../../../src/App.css'; 
import '../styles/pages/ChangePassword.css';
import { Link, useNavigate } from 'react-router-dom';

export default function RedefinirSenha() {
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);
  const [contador, setContador] = useState(0);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMensagem('');

    try {
      const response = await fetch('http://localhost:3000/api/esqueci-senha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        setMensagem('Link de redefinição enviado para seu email!');
        setContador(5);
      } else {
        setMensagem(data.message || 'Erro ao enviar link de redefinição');
      }
    } catch (error) {
      console.error('Erro:', error);
      setMensagem('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (contador > 0) {
      const timer = setTimeout(() => setContador(contador - 1), 1000);
      return () => clearTimeout(timer);
    } else if (contador === 0 && mensagem.includes('enviado')) {
      navigate('/login');
    }
  }, [contador, mensagem, navigate]);

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

          {mensagem && (
            <p style={{
              textAlign: 'center',
              marginTop: 10,
              color: mensagem.includes('enviado') ? 'green' : 'red'
            }}>
              {mensagem}
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
