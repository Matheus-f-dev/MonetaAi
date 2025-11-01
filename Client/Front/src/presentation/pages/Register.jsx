import { useState } from 'react';
import '../styles/pages/Register.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ValidationContext, EmailValidation, PasswordValidation, AmountValidation } from '../../core/services/ValidationStrategy';
import { useToast } from '../hooks/useToast';

export default function Cadastro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [salario, setSalario] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailStatus, setEmailStatus] = useState('');
  const navigate = useNavigate();
  const { loading, message, register, verifyEmail } = useAuth();
  const { addToast } = useToast();

  async function verificarEmail(email) {
    if (!email || !email.includes('@')) return;
    
    const data = await verifyEmail(email);
    setEmailStatus(data.exists ? 'exists' : 'available');
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Strategy - validações múltiplas
    const emailValidator = new ValidationContext(new EmailValidation());
    const passwordValidator = new ValidationContext(new PasswordValidation());
    const salaryValidator = new ValidationContext(new AmountValidation());
    
    const emailValidation = emailValidator.validate(email);
    const passwordValidation = passwordValidator.validate(senha);
    const salaryValidation = salaryValidator.validate(salario);
    
    if (!emailValidation.isValid) {
      addToast(emailValidation.message, 'error');
      return;
    }
    
    if (!passwordValidation.isValid) {
      addToast(passwordValidation.message, 'error');
      return;
    }
    
    if (!salaryValidation.isValid) {
      addToast('Salário deve ser um valor positivo', 'error');
      return;
    }
    
    if (senha !== confirmar) {
      addToast('Senhas não coincidem', 'error');
      return;
    }

    const dados = {
      nome,
      email,
      senha,
      confirmar,
      salario: Number(salario)
    };

    const result = await register(dados);
    
    if (result.success) {
      setTimeout(() => {
        navigate('/login');
      }, 2000);
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
          color: message.includes('sucesso') ? 'green' : 'red'
        }}>{message}</p>
      </form>

      <div className="footer-links">
        <Link to="/login">Já tenho uma conta</Link>
        <Link to="/">Voltar para o início</Link>
      </div>
    </div>
  );
}
