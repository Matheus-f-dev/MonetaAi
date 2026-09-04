import { type ReactElement } from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_GROUPS } from './navConfig';
import {
  AutomationIcon,
  CollapseIcon,
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
  /** Trilho só de ícones (desktop). No mobile o drawer ignora isso --
   * sempre abre expandido, controlado pelo hamburguer, não pelo colapso. */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ onLogout, onNavigate, collapsed = false, onToggleCollapse }: SidebarProps) {
  return (
    <nav className={[styles.sidebar, collapsed && styles.sidebarCollapsed].filter(Boolean).join(' ')} aria-label="Navegação principal">
      <div className={styles.brandRow}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">M</span>
          <span className={styles.brandText}>Moneta</span>
        </div>
        {onToggleCollapse && (
          <button
            type="button"
            className={styles.collapseToggle}
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            <CollapseIcon className={collapsed ? styles.collapseIconFlipped : undefined} />
          </button>
        )}
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
                  title={collapsed ? item.label : undefined}
                  aria-label={item.label}
                  className={({ isActive }) => [styles.item, isActive && styles.itemActive].filter(Boolean).join(' ')}
                >
                  {GroupIcon && (
                    <span className={styles.itemIcon} aria-hidden="true">
                      <GroupIcon />
                    </span>
                  )}
                  <span className={styles.itemLabel}>{item.label}</span>
                </NavLink>
              ))}
            </div>
          );
        })}
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.item} onClick={onLogout} title={collapsed ? 'Sair' : undefined} aria-label="Sair">
          <span className={styles.itemIcon} aria-hidden="true">
            <LogoutIcon />
          </span>
          <span className={styles.itemLabel}>Sair</span>
        </button>
      </div>
    </nav>
  );
}
