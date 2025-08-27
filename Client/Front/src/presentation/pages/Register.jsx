import { useState } from 'react';
import '../styles/pages/Register.css';
import { Link, useNavigate } from 'react-router-dom';

export default function Cadastro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [salario, setSalario] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [emailStatus, setEmailStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function verificarEmail(email) {
    if (!email || !email.includes('@')) return;
    
    try {
      const response = await fetch('http://localhost:3000/api/verificar-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      setEmailStatus(data.exists ? 'exists' : 'available');
    } catch (error) {
      setEmailStatus('');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMensagem('');

    const dados = {
      nome,
      email,
      senha,
      confirmar,
      salario: Number(salario)
    };

    console.log('Enviando dados:', dados);

    try {
      const response = await fetch('http://localhost:3000/api/cadastro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados)
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        setMensagem('Cadastro realizado com sucesso!');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setMensagem(data.message || 'Erro no cadastro');
      }
    } catch (error) {
      console.error('Erro:', error);
      setMensagem('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  }


  return (
      <div className="login-card animate__animated animate__fadeInDown">
        <h2>
          Crie sua conta na <span><Link to="/" className="brand-name">Moneta</Link></span>
        </h2>
        <p>Controle sua vida financeira de forma inteligente.</p>
      

      <form className="login-form" id="form-cadastro" onSubmit={handleSubmit}>
        <label>Nome completo</label>
        <input
          type="text"
          id="nome"
          placeholder="Seu nome"
          required
          value={nome}
          onChange={e => setNome(e.target.value)}
        />

        <label>Email</label>
        <input
          type="email"
          id="email"
          placeholder="seuemail@exemplo.com"
          required
          value={email}
          onChange={e => {
            setEmail(e.target.value);
            setEmailStatus('');
          }}
          onBlur={e => verificarEmail(e.target.value)}
          style={{
            borderColor: emailStatus === 'exists' ? 'red' : 
                        emailStatus === 'available' ? 'green' : ''
          }}
        />
        {emailStatus && (
          <p style={{
            fontSize: '12px',
            margin: '5px 0 0 0',
            color: emailStatus === 'exists' ? 'red' : 'green'
          }}>
            {emailStatus === 'exists' ? '✗ Este email já está em uso' : '✓ Email disponível'}
          </p>
        )}

        <label>Senha</label>
        <div className="password-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            id="senha"
            placeholder="Crie uma senha"
            required
            value={senha}
            onChange={e => setSenha(e.target.value)}
          />
          <button
            type="button"
            tabIndex="-1"
            onClick={() => setShowPassword(s => !s)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <img
              src="https://cdn-icons-png.flaticon.com/512/565/565655.png"
              alt="mostrar senha"
              width={22}
              style={{ verticalAlign: 'middle' }}
            />
          </button>
        </div>

        <label>Confirmar senha</label>
        <div className="password-wrapper">
          <input
            type={showConfirm ? 'text' : 'password'}
            id="confirmar"
            placeholder="Repita a senha"
            required
            value={confirmar}
            onChange={e => setConfirmar(e.target.value)}
            style={{
              borderColor: confirmar && senha ? 
                (senha === confirmar ? 'green' : 'red') : ''
            }}
          />
          <button
            type="button"
            tabIndex="-1"
            onClick={() => setShowConfirm(s => !s)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <img
              src="https://cdn-icons-png.flaticon.com/512/565/565655.png"
              alt="mostrar senha"
              width={22}
              style={{ verticalAlign: 'middle' }}
            />
          </button>
        </div>
        {confirmar && senha && (
          <p style={{
            fontSize: '12px',
            margin: '5px 0 0 0',
            color: senha === confirmar ? 'green' : 'red'
          }}>
            {senha === confirmar ? '✓ Senhas coincidem' : '✗ Senhas não coincidem'}
          </p>
        )}

        <label>Salário</label>
        <input
          type="number"
          id="salario"
          placeholder="Seu salário mensal"
          required
          value={salario}
          onChange={e => setSalario(e.target.value)}
        />

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? 'Cadastrando...' : 'Cadastrar'}
        </button>
        <p id="mensagem" style={{ 
          textAlign: 'center', 
          marginTop: 10,
          color: mensagem.includes('sucesso') ? 'green' : 'red'
        }}>{mensagem}</p>
      </form>

      <div className="footer-links">
        <Link to="/login">Já tenho uma conta</Link>
        <Link to="/">Voltar para o início</Link>
      </div>
    </div>
  );
}
