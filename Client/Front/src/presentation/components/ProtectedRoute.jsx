import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { decryptRoute } from '../../shared/urlCrypto';

export function ProtectedRoute({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const currentPath = location.pathname;
    
    // Rotas permitidas diretamente
    const allowedDirectRoutes = [
      '/', '/login', '/cadastro', '/esqueci-senha', '/system', 
      '/expenses', '/incomes', '/profile', '/alerts', '/reports', 
      '/analytics', '/impacto-financeiro', '/auth/callback',
      '/privacy-policy', '/terms-of-service'
    ];
    
    // Se é uma rota direta permitida, não fazer nada
    if (allowedDirectRoutes.includes(currentPath)) {
      return;
    }
    
    // Se não é uma rota criptografada e não é permitida, redirecionar para home
    if (!currentPath.startsWith('/app/')) {
      navigate('/', { replace: true });
      return;
    }
    
    // Verificar se a rota criptografada é válida
    if (currentPath.startsWith('/app/')) {
      const decryptedRoute = decryptRoute(currentPath);
      // Só redireciona se a descriptografia falhou
      if (decryptedRoute === '/') {
        navigate('/', { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  return children;
}