import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { decryptRoute } from '../../shared/urlCrypto';

export function ProtectedRoute({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const currentPath = location.pathname;
    
    // Se não é uma rota criptografada, redirecionar para home
    if (!currentPath.startsWith('/app/') && currentPath !== '/') {
      navigate('/', { replace: true });
      return;
    }
    
    // Verificar se a rota criptografada é válida
    if (currentPath.startsWith('/app/')) {
      const decryptedRoute = decryptRoute(currentPath);
      // Só redireciona se a descriptografia falhou e não é uma rota legal
      if (decryptedRoute === '/' && !['/privacy-policy', '/terms-of-service'].includes(decryptedRoute)) {
        navigate('/', { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  return children;
}