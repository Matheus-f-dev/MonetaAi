import { type ReactElement } from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_GROUPS } from './navConfig';
import {
  AutomationIcon,
  InsightsIcon,
  LogoutIcon,
  MovementIcon,
  OverviewIcon,
  PeopleIcon,
  SettingsIcon,
  WealthIcon
} from './icons';
import styles from './Sidebar.module.css';

const GROUP_ICON: Record<string, (props: { className?: string }) => ReactElement> = {
  'Visão geral': OverviewIcon,
  Movimentações: MovementIcon,
  Patrimônio: WealthIcon,
  Pessoas: PeopleIcon,
  Insights: InsightsIcon,
  Automação: AutomationIcon,
  Configurações: SettingsIcon
};

export interface SidebarProps {
  onLogout: () => void;
  /** Fecha o drawer no mobile depois de navegar -- no desktop é um no-op. */
  onNavigate?: () => void;
}

export function Sidebar({ onLogout, onNavigate }: SidebarProps) {
  return (
    <nav className={styles.sidebar} aria-label="Navegação principal">
      <div className={styles.brand}>
        <span className={styles.brandMark} aria-hidden="true">M</span>
        Moneta
      </div>

      <div className={styles.groups}>
        {NAV_GROUPS.map((group) => {
          const GroupIcon = GROUP_ICON[group.label];
          return (
            <div className={styles.group} key={group.label}>
              <span className={styles.groupLabel}>{group.label}</span>
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onNavigate}
                  className={({ isActive }) => [styles.item, isActive && styles.itemActive].filter(Boolean).join(' ')}
                >
                  {GroupIcon && (
                    <span className={styles.itemIcon} aria-hidden="true">
                      <GroupIcon />
                    </span>
                  )}
                  {item.label}
                </NavLink>
              ))}
            </div>
          );
        })}
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.item} onClick={onLogout}>
          <span className={styles.itemIcon} aria-hidden="true">
            <LogoutIcon />
          </span>
          Sair
        </button>
      </div>
    </nav>
  );
}
