import { useNavigate } from 'react-router-dom';
import { encryptRoute } from '../../shared/urlCrypto';

export const useSecureNavigation = () => {
  const navigate = useNavigate();

  const secureNavigate = (route, options = {}) => {
    const encryptedRoute = encryptRoute(route);
    navigate(encryptedRoute, options);
  };

  return { secureNavigate };
};