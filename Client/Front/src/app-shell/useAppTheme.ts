import { useCallback, useEffect, useState } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'moneta:theme';

// Chave nova de propósito -- a antiga (`theme`, de useTheme.js) guarda
// junto um esquema de cor/fonte/tamanho de um sistema de customização que
// este redesign não herda (uma direção visual só, deliberada, não um
// picker). Não reaproveitar evita ler lixo de configuração antiga.
function readStored(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}

function applyToDocument(pref: ThemePreference) {
  const root = document.documentElement;
  if (pref === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', pref);
  }
}

/**
 * "system" é o padrão -- respeita prefers-color-scheme (já implementado
 * em tokens.css) sem gravar nada no localStorage até o usuário escolher
 * ativamente. Uma vez escolhido, a preferência persiste e sobrepõe o SO.
 */
export function useAppTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStored);

  useEffect(() => {
    applyToDocument(preference);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    if (next === 'system') {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  const toggle = useCallback(() => {
    // Alterna entre claro/escuro explícitos -- alternar a partir de
    // "system" primeiro decide pelo que está renderizado nesse instante,
    // pra o clique sempre inverter o que a pessoa está vendo, não pular
    // pro estado que o SO já não estava usando.
    setPreferenceState((current) => {
      const effective =
        current === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : current;
      const next = effective === 'dark' ? 'light' : 'dark';
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return { preference, setPreference, toggle };
}
