import { MenuIcon, MoonIcon, SunIcon } from './icons';
import type { ThemePreference } from './useAppTheme';
import styles from './Topbar.module.css';

export interface TopbarProps {
  onOpenMenu: () => void;
  themePreference: ThemePreference;
  onToggleTheme: () => void;
}

function currentUserName(): string {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.nome || user.displayName || 'Usuário';
  } catch {
    return 'Usuário';
  }
}

export function Topbar({ onOpenMenu, themePreference, onToggleTheme }: TopbarProps) {
  const isDark =
    themePreference === 'dark' ||
    (themePreference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <header className={styles.topbar}>
      <button type="button" className={styles.menuButton} onClick={onOpenMenu} aria-label="Abrir menu">
        <MenuIcon />
      </button>

      <p className={styles.greeting}>
        Olá, <span className={styles.greetingName}>{currentUserName()}</span>
      </p>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onToggleTheme}
          aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        >
          {isDark ? <SunIcon width={18} height={18} /> : <MoonIcon width={18} height={18} />}
        </button>
      </div>
    </header>
  );
}
