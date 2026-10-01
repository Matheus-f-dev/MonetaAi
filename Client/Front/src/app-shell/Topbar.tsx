import { Link } from 'react-router-dom';
import { MenuIcon, MoonIcon, SunIcon } from './icons';
import { NotificationsBell } from './NotificationsBell';
import type { ThemePreference } from './useAppTheme';
import { resolveAvatarUrl } from '../shared/avatarUrl';
import { useStoredUser } from '../shared/useStoredUser';
import styles from './Topbar.module.css';

export interface TopbarProps {
  onOpenMenu: () => void;
  themePreference: ThemePreference;
  onToggleTheme: () => void;
}

export function Topbar({ onOpenMenu, themePreference, onToggleTheme }: TopbarProps) {
  const isDark =
    themePreference === 'dark' ||
    (themePreference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // useStoredUser (não um currentUserName() puro como antes) -- esse pedaço
  // precisa reagir quando o Perfil edita nome/foto, sem precisar de F5
  // (ver shared/useStoredUser.ts: ouve o CustomEvent que o Perfil dispara
  // depois de salvar).
  const storedUser = useStoredUser();
  const userName = storedUser.nome || storedUser.displayName || 'Usuário';
  const avatarSrc = resolveAvatarUrl(storedUser.avatarUrl);

  return (
    <header className={styles.topbar}>
      <button type="button" className={styles.menuButton} onClick={onOpenMenu} aria-label="Abrir menu">
        <MenuIcon />
      </button>

      <Link to="/profile" className={styles.greetingLink} aria-label="Editar perfil">
        <span className={styles.avatar} aria-hidden="true">
          {avatarSrc ? <img src={avatarSrc} alt="" className={styles.avatarImg} /> : userName.charAt(0).toUpperCase()}
        </span>
        <p className={styles.greeting}>
          Olá, <span className={styles.greetingName}>{userName}</span>
        </p>
      </Link>

      <div className={styles.actions}>
        <NotificationsBell />
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
