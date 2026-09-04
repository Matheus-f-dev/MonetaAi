import { useEffect } from 'react';

export const useTheme = () => {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedFont = localStorage.getItem('font') || 'Roboto';
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
      sysLayout.setAttribute('data-font', font);
      sysLayout.setAttribute('data-font-size', fontSize);
    }
  };

  return { applyTheme };
};