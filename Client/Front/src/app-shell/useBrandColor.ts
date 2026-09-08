import { useCallback, useEffect, useState } from 'react';
import { deriveBrandShades } from './brandColor';

const STORAGE_KEY = 'moneta:brand-color';
export const DEFAULT_BRAND_COLOR = '#0a5741';

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function isDarkNow(): boolean {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'dark') return true;
  if (attr === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// Sobrescreve os tokens do redesign (--color-brand*, Fase 0) -- 'important'
// porque system.css chegou a ter um `[data-theme="dark"] { --primary-color:
// ... !important }` (seletor de atributo nu, batendo direto no <html>) que
// vencia um style inline comum; o arquivo saiu na Fase 8 (Perfil migrado,
// último renderer de `.sys-layout`), mas manter aqui evita reabrir o mesmo
// buraco se algo parecido voltar a existir por engano.
function applyToDocument(hex: string | null) {
  const root = document.documentElement.style;
  if (!hex) {
    ['--color-brand', '--color-brand-strong', '--color-brand-soft'].forEach((prop) => root.removeProperty(prop));
    return;
  }

  const { brand, brandStrong, brandSoft } = deriveBrandShades(hex, isDarkNow());
  root.setProperty('--color-brand', brand, 'important');
  root.setProperty('--color-brand-strong', brandStrong, 'important');
  root.setProperty('--color-brand-soft', brandSoft, 'important');
}

/**
 * Aplica a cor customizada assim que qualquer componente que chame este
 * hook montar -- chamado tanto em App.jsx (toda rota) quanto em
 * ProfilePage.tsx (de onde o usuário efetivamente escolhe a cor).
 */
export function useBrandColor() {
  const [color, setColorState] = useState<string | null>(readStored);

  useEffect(() => {
    applyToDocument(color);
  }, [color]);

  // Reaplica quando o tema claro/escuro muda -- "forte"/"suave" têm
  // direção oposta em cada tema (ver brandColor.ts), então precisa
  // recalcular, não só reusar o que já tinha sido aplicado.
  useEffect(() => {
    if (!color) return undefined;

    const reapply = () => applyToDocument(color);
    const observer = new MutationObserver(reapply);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', reapply);

    return () => {
      observer.disconnect();
      mq.removeEventListener('change', reapply);
    };
  }, [color]);

  const setColor = useCallback((hex: string) => {
    setColorState(hex);
    try {
      localStorage.setItem(STORAGE_KEY, hex);
    } catch {
      // localStorage indisponível -- a cor ainda aplica pra sessão atual,
      // só não persiste pro próximo carregamento.
    }
  }, []);

  const resetColor = useCallback(() => {
    setColorState(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ver comentário acima
    }
  }, []);

  return { color, setColor, resetColor };
}
