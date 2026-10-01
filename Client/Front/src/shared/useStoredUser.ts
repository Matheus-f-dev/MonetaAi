import { useEffect, useState } from 'react';

// Não existe um contexto/store central de usuário logado no app -- login,
// 2FA e o callback do Google gravam `localStorage['user']` direto
// (useAuth.js, AuthCallback.jsx) e telas como Topbar/useCurrentUserId leem
// de volta, sem nada em comum entre elas. Esse módulo centraliza só a
// PARTE de escrever uma atualização (ex: nome/foto editados no Perfil) de
// um jeito que os lugares que já leem esse blob (Topbar) percebam sem
// precisar de F5 -- um CustomEvent já que não dá pra ouvir o próprio
// 'storage' event na mesma aba que escreveu (ele só dispara nas OUTRAS
// abas, por especificação do browser).
const USER_UPDATED_EVENT = 'moneta:user-updated';

export interface StoredUser {
  uid?: string;
  nome?: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string | null;
}

export function readStoredUser(): StoredUser {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

export function updateStoredUser(patch: Partial<StoredUser>): void {
  const merged = { ...readStoredUser(), ...patch };
  localStorage.setItem('user', JSON.stringify(merged));
  window.dispatchEvent(new Event(USER_UPDATED_EVENT));
}

export function useStoredUser(): StoredUser {
  const [user, setUser] = useState<StoredUser>(readStoredUser);

  useEffect(() => {
    function handleUpdate() {
      setUser(readStoredUser());
    }
    window.addEventListener(USER_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(USER_UPDATED_EVENT, handleUpdate);
  }, []);

  return user;
}
