import { useState } from 'react';
import { Sidebar } from '../components/system/Sidebar';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';
import { useAppTheme } from '../../app-shell/useAppTheme';
import { DEFAULT_BRAND_COLOR, useBrandColor } from '../../app-shell/useBrandColor';

export default function Profile() {
  const { addToast } = useToast();
  // Só pelo `applyTheme` (pra fonte/tamanho de fonte refletirem na hora,
  // sem esperar reload) -- tema e cor de destaque já são outros hooks,
  // ver embaixo.
  const { applyTheme } = useTheme();
  // Claro/escuro: mesmo hook do topbar do app novo (useAppTheme), não um
  // estado local próprio -- achado real testando com o app de verdade:
  // os botões antigos só escreviam num atributo dentro de `.sys-layout`,
  // que nada mais no app lia. Clicar aqui não fazia diferença nenhuma
  // fora desta própria tela. Agora é a mesma fonte de verdade do toggle
  // no topbar (que já funcionava): os dois sempre concordam.
  const { preference: theme, setPreference: setTheme } = useAppTheme();
  // Cor de destaque: idem -- a lista de 4 cores fixas (Roxo/Azul/Verde/
  // Rosa) tinha exatamente o mesmo problema (só mudava um atributo que
  // nada lia) E nem cobria "qualquer cor" -- troquei por um seletor de
  // cor de verdade (input nativo do navegador, mostra a paleta RGB/hex
  // pra escolher qualquer tom), que aplica em tempo real no app inteiro
  // (telas novas E antigas -- ver useBrandColor).
  const { color: brandColor, setColor: setBrandColor, resetColor: resetBrandColor } = useBrandColor();
  const [font, setFont] = useState(() => localStorage.getItem('font') || '');
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('fontSize') || 'medium');

  // "system" (padrão antes de qualquer escolha explícita) não é nem
  // "light" nem "dark" -- resolve pro que está de fato na tela agora,
  // só pra decidir qual dos dois cartões mostrar como selecionado.
  const effectiveTheme =
    theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  const handleFontChange = (newFont) => {
    setFont(newFont);
    applyTheme(effectiveTheme, newFont, fontSize);
  };

  const handleFontSizeChange = (newFontSize) => {
    setFontSize(newFontSize);
    applyTheme(effectiveTheme, font, newFontSize);
  };

  const savePreferences = () => {
    localStorage.setItem('font', font);
    localStorage.setItem('fontSize', fontSize);
    addToast('Preferências salvas com sucesso!', 'success');
  };

  const resetToDefault = () => {
    setTheme('system');
    resetBrandColor();
    setFont('');
    setFontSize('medium');
    // font vazio -- .sys-layout já tem Hanken Grotesk como padrão direto
    // no CSS, sem precisar de nenhum atributo (ver system.css).
    applyTheme(effectiveTheme, null, 'medium');
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
                className={`theme-card ${effectiveTheme === 'light' ? 'selected' : ''}`}
                onClick={() => handleThemeChange('light')}
              >
                <div className="theme-text">Claro</div>
                <div className="theme-preview light-preview"></div>
                <span>Claro</span>
              </div>
              <div
                className={`theme-card ${effectiveTheme === 'dark' ? 'selected' : ''}`}
                onClick={() => handleThemeChange('dark')}
              >
                <div className="theme-text">Escuro</div>
                <div className="theme-preview dark-preview"></div>
                <span>Escuro</span>
              </div>

            </div>
          </div>

          <div className="profile-section">
            <h2>Cor de destaque</h2>
            <div className="color-picker-row">
              <input
                type="color"
                className="color-picker-input"
                value={brandColor || DEFAULT_BRAND_COLOR}
                onChange={(e) => setBrandColor(e.target.value)}
                aria-label="Escolher cor de destaque"
              />
              <div className="color-picker-info">
                <span className="color-picker-hex">{(brandColor || DEFAULT_BRAND_COLOR).toUpperCase()}</span>
                <span className="color-picker-hint">Clique no quadrado pra escolher qualquer cor (paleta ou RGB/hex)</span>
              </div>
              {brandColor && (
                <button type="button" className="btn-secondary color-picker-reset" onClick={resetBrandColor}>
                  Usar cor padrão
                </button>
              )}
            </div>
          </div>

          <div className="profile-section">
            <h2>Fonte</h2>
            <select 
              value={font} 
              onChange={(e) => handleFontChange(e.target.value)}
              className="profile-select"
            >
              <option value="">Hanken Grotesk (padrão)</option>
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