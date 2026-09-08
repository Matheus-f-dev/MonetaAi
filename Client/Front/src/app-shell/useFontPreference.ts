import { useCallback, useEffect, useState } from 'react';

// Fase 8 -- herda a intenção do seletor de fonte/tamanho que só existia no
// Perfil antigo (useTheme.js + system.css[data-font]/[data-font-size]),
// mas reescrito: aquele mecanismo só alcançava `.sys-layout` (Agente de IA
// e o próprio Perfil, as duas únicas telas que ainda usavam), então parava
// de valer pra tudo que já tinha migrado desde a Fase 2. Aplicado aqui em
// `--font-body` (lido por `.ds-scope` inteiro, ver global.css) alcança o
// app logado inteiro, não só as duas telas que sobravam.
const FONT_KEY = 'font';
const SIZE_KEY = 'fontSize';

export type FontSize = 'small' | 'medium' | 'large';

export interface FontOption {
  value: string;
  label: string;
}

export const FONT_OPTIONS: FontOption[] = [
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Open Sans', label: 'Open Sans' }
];

export const FONT_SIZE_OPTIONS: Array<{ value: FontSize; label: string }> = [
  { value: 'small', label: 'Pequeno' },
  { value: 'medium', label: 'Médio (padrão)' },
  { value: 'large', label: 'Grande' }
];

// Nenhuma dessas 4 famílias era carregada em lugar nenhum antes -- o
// seletor antigo oferecia a opção, mas sem @import/<link> nenhum a fonte
// só aparecia de verdade em quem já tinha o arquivo instalado no SO (o
// caso comum de Roboto, quase nunca o de Inter/Poppins/Open Sans). Carga
// sob demanda (só a família escolhida, só quando escolhida) em vez de
// somar as 4 no <link> global do index.html -- ninguém paga o peso de
// bytes de fonte que talvez nunca escolha.
const GOOGLE_FONT_QUERY: Record<string, string> = {
  Roboto: 'Roboto:wght@400;500;600;700',
  Inter: 'Inter:wght@400;500;600;700',
  Poppins: 'Poppins:wght@400;500;600;700',
  'Open Sans': 'Open+Sans:wght@400;500;600;700'
};

function loadGoogleFont(family: string) {
  const query = GOOGLE_FONT_QUERY[family];
  if (!query) return;
  const id = `moneta-font-${family.replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${query}&display=swap`;
  document.head.appendChild(link);
}

function readFont(): string {
  try {
    return localStorage.getItem(FONT_KEY) || '';
  } catch {
    return '';
  }
}

function readFontSize(): FontSize {
  try {
    const stored = localStorage.getItem(SIZE_KEY);
    return stored === 'small' || stored === 'large' ? stored : 'medium';
  } catch {
    return 'medium';
  }
}

function applyFont(font: string) {
  const root = document.documentElement.style;
  if (!font) {
    root.removeProperty('--font-body');
    return;
  }
  loadGoogleFont(font);
  root.setProperty('--font-body', `'${font}', 'Hanken Grotesk', 'Segoe UI', sans-serif`, 'important');
}

// `data-font-scale` no <html> -- tokens.css redeclara --text-* só dentro
// de `.ds-scope` sob esse atributo (ver o bloco lá), nunca em :root: uma
// escala de texto vazando pra landing/auth (que têm a própria escala,
// --t-*/--auth-font-*, sem relação com esta) seria uma regressão fora do
// escopo deste redesign.
function applyFontSize(size: FontSize) {
  if (size === 'medium') {
    document.documentElement.removeAttribute('data-font-scale');
  } else {
    document.documentElement.setAttribute('data-font-scale', size);
  }
}

export function useFontPreference() {
  const [font, setFontState] = useState<string>(readFont);
  const [fontSize, setFontSizeState] = useState<FontSize>(readFontSize);

  useEffect(() => {
    applyFont(font);
  }, [font]);

  useEffect(() => {
    applyFontSize(fontSize);
  }, [fontSize]);

  const setFont = useCallback((next: string) => {
    setFontState(next);
    try {
      if (next) localStorage.setItem(FONT_KEY, next);
      else localStorage.removeItem(FONT_KEY);
    } catch {
      // localStorage indisponível -- aplica só pra sessão atual.
    }
  }, []);

  const setFontSize = useCallback((next: FontSize) => {
    setFontSizeState(next);
    try {
      localStorage.setItem(SIZE_KEY, next);
    } catch {
      // ver comentário acima
    }
  }, []);

  const reset = useCallback(() => {
    setFont('');
    setFontSize('medium');
  }, [setFont, setFontSize]);

  return { font, setFont, fontSize, setFontSize, reset };
}
