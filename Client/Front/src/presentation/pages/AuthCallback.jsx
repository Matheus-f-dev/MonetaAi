import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      navigate('/login?error=Erro na autenticação com Google');
      return;
    }

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        
        // Salvar no localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Redirecionar para o sistema
        navigate('/system');
      } catch (error) {
        console.error('Erro ao processar dados do usuário:', error);
        navigate('/login?error=Erro ao processar dados do usuário');
      }
    } else {
      navigate('/login?error=Dados de autenticação inválidos');
    }
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