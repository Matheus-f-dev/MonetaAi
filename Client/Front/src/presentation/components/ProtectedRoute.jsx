import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Rotas que não exigem sessão ativa — login, cadastro, páginas públicas e o
// callback do Google (que é justamente quem CRIA a sessão).
const PUBLIC_ROUTES = [
  '/', '/login', '/cadastro', '/esqueci-senha',
  '/auth/callback', '/privacy-policy', '/terms-of-service'
];

// Existe um token no localStorage e ele ainda não expirou? Decodifica só o
// payload do JWT (sem checar assinatura — isso é sempre papel da API em
// cada chamada); aqui é só pra decidir se vale renderizar a página ou
// mandar direto pro login, sem depender de esperar a API responder 401.
function hasValidSession() {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return !payload.exp || payload.exp * 1000 > Date.now();
  } catch {
    return false; // token corrompido/ilegível = trata como não logado
  }
}

export function ProtectedRoute({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname;
  const authorized = PUBLIC_ROUTES.includes(currentPath) || hasValidSession();

  // O redirecionamento em si precisa ser um efeito (não dá pra chamar
  // navigate() durante o render) -- mas a decisão de NÃO renderizar
  // `children` é calculada acima, direto no render, de propósito: se isso
  // dependesse só deste efeito, a página protegida (e os efeitos dela --
  // ex.: fetch de saldo/transações) já teria montado no primeiro paint,
  // antes do efeito abaixo rodar (efeito de componente filho dispara antes
  // do efeito do pai). Não chegava a vazar dado nenhum de verdade -- a API
  // também exige o JWT em cada chamada -- mas piscava a tela protegida por
  // um frame pra quem não tinha sessão nenhuma. Retornando `null`
  // enquanto `authorized` for falso evita esse flash.
  useEffect(() => {
    if (!authorized) {
      navigate('/login', { replace: true });
    }
  }, [authorized, navigate]);

  if (!authorized) return null;

  return children;
}
