import { useEffect } from 'react';

// 12h, não 24h: tokens emitidos ANTES de a sessão passar a 30 dias ainda
// duram 24h -- com limite de 1 dia eles só renovariam depois de expirados.
const REFRESH_AFTER_MS = 12 * 60 * 60 * 1000;

function readIssuedAt(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.iat === 'number' ? payload.iat * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Sessão deslizante: o token do backend dura 30 dias, e cada vez que o
 * sistema abre com um token com mais de 12h, troca por um novo (prazo
 * cheio de novo). Quem usa de vez em quando nunca precisa digitar a senha;
 * só quem passa 30 dias sem abrir cai no login. O limite de 12h evita
 * uma chamada de API a cada recarregamento de página.
 *
 * Falha de rede aqui nunca desloga: o token atual continua valendo até
 * expirar, a renovação só tenta de novo na próxima abertura.
 */
export function useSessionRefresh() {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const issuedAt = readIssuedAt(token);
    if (issuedAt !== null && Date.now() - issuedAt < REFRESH_AFTER_MS) return;

    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    fetch(`${baseURL}/api/auth/refresh`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && typeof data.token === 'string') {
          localStorage.setItem('token', data.token);
        }
      })
      .catch(() => {
        // Sem rede/servidor fora: mantém o token atual, tenta na próxima abertura.
      });
  }, []);
}
