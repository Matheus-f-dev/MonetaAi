import CryptoJS from 'crypto-js';

const SECRET_KEY = 'MonetaAi2024SecretKey!@#$%';

// Mapeamento de rotas originais para IDs
const ROUTE_MAP = {
  '/': 'home',
  '/login': 'auth',
  '/cadastro': 'register', 
  '/esqueci-senha': 'reset',
  '/system': 'dashboard',
  '/expenses': 'out',
  '/incomes': 'in',
  '/profile': 'user',
  '/alerts': 'notify',
  '/reports': 'data',
  '/analytics': 'stats',
  '/impacto-financeiro': 'impact',
  '/auth/callback': 'callback'
};

// Mapeamento reverso
const ID_TO_ROUTE = Object.fromEntries(
  Object.entries(ROUTE_MAP).map(([route, id]) => [id, route])
);

export const encryptRoute = (route) => {
  const routeId = ROUTE_MAP[route];
  if (!routeId) return route;
  
  const encrypted = CryptoJS.AES.encrypt(routeId, SECRET_KEY).toString();
  return `/app/${encrypted.replace(/[/+=]/g, (match) => {
    switch (match) {
      case '/': return '_';
      case '+': return '-';
      case '=': return '.';
      default: return match;
    }
  })}`;
};

export const decryptRoute = (encryptedPath) => {
  if (!encryptedPath.startsWith('/app/')) return encryptedPath;
  
  try {
    const encrypted = encryptedPath.replace('/app/', '').replace(/[_\-.]/g, (match) => {
      switch (match) {
        case '_': return '/';
        case '-': return '+';
        case '.': return '=';
        default: return match;
      }
    });
    
    const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY).toString(CryptoJS.enc.Utf8);
    return ID_TO_ROUTE[decrypted] || '/';
  } catch {
    return '/';
  }
};

export const getEncryptedRoutes = () => {
  return Object.keys(ROUTE_MAP).reduce((acc, route) => {
    acc[route] = encryptRoute(route);
    return acc;
  }, {});
};