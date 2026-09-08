import { Button, Card, Select } from '../../design-system';
import { useToast } from '../../presentation/hooks/useToast';
import { useAppTheme, type ThemePreference } from '../../app-shell/useAppTheme';
import { DEFAULT_BRAND_COLOR, useBrandColor } from '../../app-shell/useBrandColor';
import { FONT_OPTIONS, FONT_SIZE_OPTIONS, useFontPreference } from '../../app-shell/useFontPreference';
import styles from './ProfilePage.module.css';

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Sistema' }
];

/**
 * Fase 8 -- migra /profile pro AppShell. Última tela protegida com
 * layout próprio (Fase 7 já tinha levado o Agente de IA) -- depois dela,
 * `.sys-layout`/Sidebar antiga/useTheme.js não têm mais nenhum renderer
 * no app inteiro, e saem juntos (ver histórico de commits).
 *
 * Mesmas 3 preferências de sempre (tema, cor de destaque, fonte), mas
 * cada uma aplica e persiste na hora -- nenhuma delas precisa de um botão
 * "Salvar" separado (o tema no topbar e a cor de destaque já funcionavam
 * assim; um botão de salvar que não faz nada só pras outras duas seria
 * uma promessa vazia). "Restaurar padrão" continua -- é a única ação em
 * lote que faz sentido pedir com um clique.
 */
export default function ProfilePage() {
  const { addToast } = useToast();
  const { preference: theme, setPreference: setTheme } = useAppTheme();
  const { color: brandColor, setColor: setBrandColor, resetColor: resetBrandColor } = useBrandColor();
  const { font, setFont, fontSize, setFontSize, reset: resetFont } = useFontPreference();

  function handleReset() {
    setTheme('system');
    resetBrandColor();
    resetFont();
    addToast('Preferências restauradas.', 'success');
  }

  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.title}>Perfil</h1>
        <p className={styles.subtitle}>Personalize a aparência da Moneta -- tema, cor de destaque e tipografia.</p>
      </div>

      <Card>
        <h2 className={styles.sectionTitle}>Tema</h2>
        <p className={styles.sectionHint}>“Sistema” segue o que o seu dispositivo já usa.</p>
        <div className={styles.themeOptions}>
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={[styles.themeCard, theme === opt.value && styles.themeCardActive].filter(Boolean).join(' ')}
              onClick={() => setTheme(opt.value)}
              aria-pressed={theme === opt.value}
            >
              <span className={[styles.themeSwatch, styles[`swatch${opt.value}`]].filter(Boolean).join(' ')} aria-hidden="true" />
              {opt.label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className={styles.sectionTitle}>Cor de destaque</h2>
        <p className={styles.sectionHint}>Usada em botões, links e destaques em todo o app -- qualquer cor, escolhida por você.</p>
        <div className={styles.colorRow}>
          <input
            type="color"
            className={styles.colorInput}
            value={brandColor || DEFAULT_BRAND_COLOR}
            onChange={(e) => setBrandColor(e.target.value)}
            aria-label="Escolher cor de destaque"
          />
          <div className={styles.colorInfo}>
            <span className={styles.colorHex}>{(brandColor || DEFAULT_BRAND_COLOR).toUpperCase()}</span>
            <span className={styles.sectionHint}>Clique no quadrado para escolher qualquer cor (paleta ou RGB/hex)</span>
          </div>
          {brandColor && (
            <Button type="button" variant="secondary" size="sm" onClick={resetBrandColor}>
              Usar cor padrão
            </Button>
          )}
        </div>
      </Card>

      <Card>
        <h2 className={styles.sectionTitle}>Tipografia</h2>
        <div className={styles.typographyGrid}>
          <Select
            label="Fonte"
            value={font}
            onChange={(e) => setFont(e.target.value)}
            options={FONT_OPTIONS}
            placeholder="Hanken Grotesk (padrão)"
          />
          <Select
            label="Tamanho da fonte"
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value as typeof fontSize)}
            options={FONT_SIZE_OPTIONS}
          />
        </div>
      </Card>

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={handleReset}>
          Restaurar padrão
        </Button>
      </div>
    </div>
  );
}
