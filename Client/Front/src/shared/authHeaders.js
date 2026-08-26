// Fonte única do header de autenticação pros hooks que ainda usam fetch()
// cru em vez do ApiConnection singleton — sem isso, toda rota da API (que
// agora exige token) responderia 401 pra essas telas.
export function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}
