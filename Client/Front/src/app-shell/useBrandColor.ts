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

// Sobrescreve tanto os tokens do redesign (--color-brand*, Fase 0) quanto
// as variáveis legadas que as telas ainda não migradas (Perfil, Agente de
// IA) usam pra cor de destaque (--primary*, de _variables.css) -- sem
// isso, escolher uma cor só mudava metade do app, e ficava exatamente o
// "jogo de cor" que não combina (verde-pinho fixo de um lado, roxo fixo
// do outro) que motivou o pedido.
function applyToDocument(hex: string | null) {
  const root = document.documentElement.style;
  if (!hex) {
    ['--color-brand', '--color-brand-strong', '--color-brand-soft', '--primary-color', '--primary', '--primary-dark', '--primary-light'].forEach(
      (prop) => root.removeProperty(prop)
    );
    return;
  }

  const { brand, brandStrong, brandSoft } = deriveBrandShades(hex, isDarkNow());
  // 'important' nas duas famílias: system.css tem `[data-theme="dark"] {
  // --primary-color: ... !important }` -- um seletor de atributo NU (sem
  // `.sys-layout` na frente), que bate direto no próprio <html> (mesmo
  // elemento onde useAppTheme grava `data-theme`). !important de
  // stylesheet vence style inline comum, então sem isso a cor escolhida
  // nunca pegava nas variáveis legadas -- achado real testando o picker.
  root.setProperty('--color-brand', brand, 'important');
  root.setProperty('--color-brand-strong', brandStrong, 'important');
  root.setProperty('--color-brand-soft', brandSoft, 'important');
  // Variáveis legadas (system.css / _variables.css) -- nomes diferentes,
  // mesmo papel visual.
  root.setProperty('--primary-color', brand, 'important');
  root.setProperty('--primary', brand, 'important');
  root.setProperty('--primary-dark', brandStrong, 'important');
  root.setProperty('--primary-light', brandSoft, 'important');
}

/**
 * Aplica a cor customizada assim que qualquer componente que chame este
 * hook montar -- chamado tanto em App.jsx (toda rota, garante que aplica
 * mesmo entrando direto numa página antiga como /profile ou /agent) quanto
 * em Profile.jsx (de onde o usuário efetivamente escolhe a cor).
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
