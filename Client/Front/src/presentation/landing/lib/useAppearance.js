import { useEffect, useState } from 'react';

// Resolve a aparência da landing UMA vez e devolve 'light' | 'dark'.
//
// Ordem de decisão:
//   1. `[data-theme]` no <html> — se o app já cravou um tema, ele manda.
//   2. preferência do sistema operacional.
//
// Fazer isso em JS evita triplicar a lista de tokens em CSS (media query +
// dois escopos de atributo) e mantém um bloco escuro só. Como a landing é
// renderizada pelo cliente de qualquer forma, não existe flash: nada aparece
// antes do JS rodar.
const QUERY = '(prefers-color-scheme: dark)';

function read() {
  if (typeof window === 'undefined') return 'light';
  const stamped = document.documentElement.getAttribute('data-theme');
  if (stamped === 'dark' || stamped === 'light') return stamped;
  return window.matchMedia?.(QUERY).matches ? 'dark' : 'light';
}

export function useAppearance() {
  const [appearance, setAppearance] = useState(read);

  useEffect(() => {
    const mq = window.matchMedia?.(QUERY);
    if (!mq) return undefined;

    const sync = () => setAppearance(read());
    mq.addEventListener('change', sync);

    // O app pode cravar data-theme depois da montagem (useTheme roda em
    // efeito), então observamos o atributo em vez de ler só uma vez.
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      mq.removeEventListener('change', sync);
      observer.disconnect();
    };
  }, []);

  return appearance;
}
