import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      navigate('/login?error=Erro na autenticação com Google');
      return;
    }

    if (!code) {
      navigate('/login?error=Dados de autenticação inválidos');
      return;
    }

    // O backend não manda mais token/user na URL (achado #12 -- ficava em
    // log de acesso e histórico do navegador). Troca o código de uso único
    // pelo token de verdade aqui, via POST -- nunca aparece numa URL.
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/exchange`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });
        const data = await res.json();

        if (!data.success) {
          navigate(`/login?error=${encodeURIComponent(data.message || 'Não foi possível concluir o login com Google')}`);
          return;
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/system');
      } catch (err) {
        console.error('Erro ao trocar código de login:', err);
        navigate('/login?error=Erro ao processar dados do usuário');
      }
    })();
  }, [navigate, searchParams]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      color: '#fff'
    }}>
      <p>Processando login...</p>
    </div>
  );
}