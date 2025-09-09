import { useState, useEffect } from 'react';
import { Sidebar } from '../components/system/Sidebar';

export default function Profile() {
  const [theme, setTheme] = useState('light');
  const [colorScheme, setColorScheme] = useState('purple');
  const [font, setFont] = useState('Roboto');
  const [fontSize, setFontSize] = useState('medium');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedColorScheme = localStorage.getItem('colorScheme') || 'purple';
    const savedFont = localStorage.getItem('font') || 'Roboto';
    const savedFontSize = localStorage.getItem('fontSize') || 'medium';
    
    setTheme(savedTheme);
    setColorScheme(savedColorScheme);
    setFont(savedFont);
    setFontSize(savedFontSize);
    
    applyTheme(savedTheme, savedColorScheme, savedFont, savedFontSize);
  }, []);

  const applyTheme = (selectedTheme, selectedColorScheme, selectedFont, selectedFontSize) => {
    const sysLayout = document.querySelector('.sys-layout');
    if (sysLayout) {
      sysLayout.setAttribute('data-theme', selectedTheme);
      sysLayout.setAttribute('data-color-scheme', selectedColorScheme);
      sysLayout.setAttribute('data-font', selectedFont);
      sysLayout.setAttribute('data-font-size', selectedFontSize);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    applyTheme(newTheme, colorScheme, font, fontSize);
  };

  const handleColorSchemeChange = (newColorScheme) => {
    setColorScheme(newColorScheme);
    applyTheme(theme, newColorScheme, font, fontSize);
  };

  const handleFontChange = (newFont) => {
    setFont(newFont);
    applyTheme(theme, colorScheme, newFont, fontSize);
  };

  const handleFontSizeChange = (newFontSize) => {
    setFontSize(newFontSize);
    applyTheme(theme, colorScheme, font, newFontSize);
  };

  const savePreferences = () => {
    localStorage.setItem('theme', theme);
    localStorage.setItem('colorScheme', colorScheme);
    localStorage.setItem('font', font);
    localStorage.setItem('fontSize', fontSize);
    alert('Preferências salvas com sucesso!');
  };

  const resetToDefault = () => {
    setTheme('light');
    setColorScheme('purple');
    setFont('Roboto');
    setFontSize('medium');
    applyTheme('light', 'purple', 'Roboto', 'medium');
    localStorage.removeItem('theme');
    localStorage.removeItem('colorScheme');
    localStorage.removeItem('font');
    localStorage.removeItem('fontSize');
  };

  return (
    <div className="sys-layout">
      <Sidebar />
      <main className="sys-main">
        <div className="profile-container">
          <div className="profile-header">
            <h1>Aparência</h1>
            <p>Personalize a interface da MonetaAi</p>
          </div>

          <div className="profile-section">
            <h2>Tema</h2>
            <div className="theme-options">
              <div 
                className={`theme-card ${theme === 'light' ? 'selected' : ''}`}
                onClick={() => handleThemeChange('light')}
              >
                <div className="theme-text">Claro</div>
                <div className="theme-preview light-preview"></div>
                <span>Claro</span>
              </div>
              <div 
                className={`theme-card ${theme === 'dark' ? 'selected' : ''}`}
                onClick={() => handleThemeChange('dark')}
              >
                <div className="theme-text">Escuro</div>
                <div className="theme-preview dark-preview"></div>
                <span>Escuro</span>
              </div>

            </div>
          </div>

          <div className="profile-section">
            <h2>Esquema de cores</h2>
            <div className="color-options">
              <div 
                className={`color-card ${colorScheme === 'purple' ? 'selected' : ''}`}
                onClick={() => handleColorSchemeChange('purple')}
              >
                <div className="color-circle purple"></div>
                <span>Roxo (padrão)</span>
              </div>
              <div 
                className={`color-card ${colorScheme === 'blue' ? 'selected' : ''}`}
                onClick={() => handleColorSchemeChange('blue')}
              >
                <div className="color-circle blue"></div>
                <span>Azul</span>
              </div>
              <div 
                className={`color-card ${colorScheme === 'green' ? 'selected' : ''}`}
                onClick={() => handleColorSchemeChange('green')}
              >
                <div className="color-circle green"></div>
                <span>Verde</span>
              </div>
              <div 
                className={`color-card ${colorScheme === 'pink' ? 'selected' : ''}`}
                onClick={() => handleColorSchemeChange('pink')}
              >
                <div className="color-circle pink"></div>
                <span>Rosa</span>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h2>Fonte</h2>
            <select 
              value={font} 
              onChange={(e) => handleFontChange(e.target.value)}
              className="profile-select"
            >
              <option value="Roboto">Roboto</option>
              <option value="Inter">Inter</option>
              <option value="Poppins">Poppins</option>
              <option value="Open Sans">Open Sans</option>
            </select>
          </div>

          <div className="profile-section">
            <h2>Tamanho da fonte</h2>
            <select 
              value={fontSize} 
              onChange={(e) => handleFontSizeChange(e.target.value)}
              className="profile-select"
            >
              <option value="small">Pequeno</option>
              <option value="medium">Médio (padrão)</option>
              <option value="large">Grande</option>
            </select>
          </div>

          <div className="profile-actions">
            <button className="btn-secondary" onClick={resetToDefault}>
              Restaurar padrão
            </button>
            <button className="btn-primary" onClick={savePreferences}>
              Salvar preferências
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}