import { useEffect } from 'react';

export const useTheme = () => {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    // Sem fallback pra 'Roboto' aqui -- `.sys-layout` já tem Hanken
    // Grotesk como padrão direto no CSS (system.css), sem depender de
    // atributo nenhum (ver o comentário lá: este efeito só roda uma vez,
    // no primeiro carregamento de App(), não a cada navegação de rota,
    // então não dava pra confiar nele como única fonte da fonte padrão).
    // `data-font` só é escrito quando existe uma escolha de verdade
    // salva -- senão o CSS decide sozinho.
    const savedFont = localStorage.getItem('font');
    const savedFontSize = localStorage.getItem('fontSize') || 'medium';

    applyTheme(savedTheme, savedFont, savedFontSize);
  }, []);

  // `data-color-scheme` saía daqui sempre com o valor default ('purple'),
  // toda vez que qualquer rota montava -- reescrevia por cima da cor
  // customizada (useBrandColor, aplicada via inline style em <html>) todo
  // carregamento, porque `[data-color-scheme="purple"]` em system.css
  // redeclara --primary-color localmente dentro de `.sys-layout`, o que
  // vence o valor herdado do <html>. Achado real testando o seletor de
  // cor: a cor escolhida nunca pegava no Perfil por causa disso. Nada
  // mais no app depende de `data-color-scheme` -- não seta mais.
  const applyTheme = (theme, font, fontSize) => {
    const sysLayout = document.querySelector('.sys-layout');
    if (sysLayout) {
      sysLayout.setAttribute('data-theme', theme);
      if (font) {
        sysLayout.setAttribute('data-font', font);
      } else {
        sysLayout.removeAttribute('data-font');
      }
      sysLayout.setAttribute('data-font-size', fontSize);
    }
  };

  return { applyTheme };
};