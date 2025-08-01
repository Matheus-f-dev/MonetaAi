import { useState } from 'react';
//import '../../../src/App.css'; 
import '../styles/pages/ChangePassword.css';
import { Link } from 'react-router-dom';

export default function RedefinirSenha() {
  const [email, setEmail] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    // Aqui você pode chamar sua API ou exibir um alerta
    alert('Link de redefinição enviado para: ' + email);
  }

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

          <button type="submit">Enviar link de redefinição</button>

          <div className="links">
            <Link to="/login">Voltar ao login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
