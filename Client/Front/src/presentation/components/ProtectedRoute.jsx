import { Navigate, Outlet } from 'react-router-dom';

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

// Adaptado na Fase 1 do redesign pra árvore de rotas real (react-router
// <Route> aninhado): antes era um componente que recebia `children` e
// decidia renderizar ou não; agora é o `element` de um <Route> pai, e
// `Outlet` renderiza o filho que casou com a URL. A lista de rotas
// públicas sumiu de propósito -- não faz falta mais, porque com rotas de
// verdade uma página pública simplesmente não é filha deste <Route>, em
// vez de precisar aparecer numa lista de exceções aqui dentro.
//
// `<Navigate>` renderiza null enquanto redireciona (o próprio react-router
// faz isso via efeito interno) -- então esta troca também elimina, de
// graça, o flash de conteúdo protegido que a versão anterior corrigia na
// mão (calculando `authorized` fora do efeito): aqui `Outlet` (a página
// protegida) só é alcançado quando `hasValidSession()` já é verdadeiro,
// nunca chega a montar pra depois ser desmontado.
export function ProtectedRoute() {
  if (!hasValidSession()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
