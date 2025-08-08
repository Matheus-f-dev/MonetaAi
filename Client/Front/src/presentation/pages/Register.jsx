import { useState } from 'react';
//import '../../../src/App.css'; 
import '../styles/pages/Register.css';
import { Link } from 'react-router-dom';

export default function Cadastro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mensagem, setMensagem] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (senha !== confirmar) {
      setMensagem('As senhas não coincidem!');
      return;
    }
    setMensagem('Cadastro enviado!');
    // Aqui você pode chamar a API de cadastro real depois
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
          type="text"
          id="email"
          placeholder="seuemail@exemplo.com"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

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

        <button type="submit" className="login-btn">Cadastrar</button>
        <p id="mensagem" style={{ textAlign: 'center', marginTop: 10 }}>{mensagem}</p>
      </form>

      <div className="footer-links">
        <Link to="/login">Já tenho uma conta</Link>
        <Link to="/">Voltar para o início</Link>
      </div>
    </div>
  );
}
