import { useEffect } from 'react';

export const useTheme = () => {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedColorScheme = localStorage.getItem('colorScheme') || 'purple';
    const savedFont = localStorage.getItem('font') || 'Roboto';
    const savedFontSize = localStorage.getItem('fontSize') || 'medium';
    
    applyTheme(savedTheme, savedColorScheme, savedFont, savedFontSize);
  }, []);

  const applyTheme = (theme, colorScheme, font, fontSize) => {
    const sysLayout = document.querySelector('.sys-layout');
    if (sysLayout) {
      sysLayout.setAttribute('data-theme', theme);
      sysLayout.setAttribute('data-color-scheme', colorScheme);
      sysLayout.setAttribute('data-font', font);
      sysLayout.setAttribute('data-font-size', fontSize);
    }
  };

  return { applyTheme };
};