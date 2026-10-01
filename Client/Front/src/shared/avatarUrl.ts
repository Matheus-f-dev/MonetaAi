// AuthController.updateProfile grava um caminho relativo (/api/uploads/...),
// nunca a URL absoluta (ver migration 20261001150000) -- funciona igual em
// dev e produção porque nginx/Node servem o path de baixo do mesmo jeito.
// Só que um <img src> relativo resolve contra a ORIGEM DA PÁGINA, não do
// backend -- em produção os dois são a mesma origem (nginx serve o SPA e
// faz proxy de /api pro Node), mas em dev são portas diferentes
// (localhost:5173 x localhost:3000, sem proxy configurado no Vite), então
// aqui é preciso prefixar com a base da API.
export function resolveAvatarUrl(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) return null;
  if (/^https?:\/\//.test(avatarUrl)) return avatarUrl;
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${baseURL}${avatarUrl}`;
}
