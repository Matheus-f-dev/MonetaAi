import { useEffect, useState, type FocusEvent, type MouseEvent, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { NAV_GROUPS } from './navConfig';
import {
  AutomationIcon,
  CollapseIcon,
  DisclosureIcon,
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

interface TooltipState {
  label: string;
  top: number;
  left: number;
}

function groupContaining(pathname: string): string | undefined {
  return NAV_GROUPS.find((g) => g.items.some((item) => item.path === pathname))?.label;
}

export function Sidebar({ onLogout, onNavigate, collapsed = false, onToggleCollapse }: SidebarProps) {
  const location = useLocation();

  // Pedido do usuário: a lista só cresce a cada fase (7 grupos, mais de 20
  // itens no total) -- cada grupo vira um dropdown, só o grupo da rota
  // ativa começa aberto. Estado local (não persiste entre sessões de
  // propósito -- é sobre reduzir o que aparece numa carga de página, não
  // sobre lembrar preferência; abrir tudo de novo a cada F5 é esperado).
  // Não se aplica ao trilho colapsado (só ícone): lá não tem rótulo nem
  // espaço pra um chevron, os itens do grupo já aparecem direto.
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const active = groupContaining(location.pathname);
    return active ? { [active]: true } : {};
  });

  // Navegar pra uma rota de um grupo ainda fechado abre ele sozinho (sem
  // fechar os outros que a pessoa já tinha aberto na mão) -- senão a rota
  // ativa ficaria escondida atrás de um dropdown fechado.
  useEffect(() => {
    const active = groupContaining(location.pathname);
    if (active) {
      setExpandedGroups((prev) => (prev[active] ? prev : { ...prev, [active]: true }));
    }
  }, [location.pathname]);

  function toggleGroup(label: string) {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  // Tooltip próprio pros itens colapsados (trilho só de ícones) -- não o
  // `title` nativo do navegador, que aparecia como uma caixa branca crua,
  // fora do tema, exatamente o "jogo de cor" que não combina que motivou o
  // resto deste redesign. Não é só estética: dentro de um grupo (ex.
  // "Automação"), TODO item compartilha o mesmo ícone (um por grupo, não
  // por item -- ver GROUP_ICON) -- sem rótulo nenhum, "Agente IA" e
  // "Alertas" ficam visualmente idênticos no trilho colapsado. `aria-label`
  // continua cobrindo leitor de tela independente disso.
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  function showTooltip(e: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>, label: string) {
    if (!collapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ label, top: rect.top + rect.height / 2, left: rect.right + 8 });
  }

  function hideTooltip() {
    setTooltip(null);
  }

  return (
    <nav className={[styles.sidebar, collapsed && styles.sidebarCollapsed].filter(Boolean).join(' ')} aria-label="Navegação principal">
      <div className={styles.brandRow}>
        <Link to="/system" className={styles.brand} onClick={onNavigate} aria-label="Ir para o painel">
          <span className={styles.brandMark} aria-hidden="true">M</span>
          <span className={styles.brandText}>Moneta</span>
        </Link>
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
          const groupId = `nav-group-${group.label.replace(/\s+/g, '-')}`;
          const expanded = collapsed || Boolean(expandedGroups[group.label]);
          return (
            <div className={styles.group} key={group.label}>
              {collapsed ? (
                <span className={styles.groupLabel}>{group.label}</span>
              ) : (
                <button
                  type="button"
                  className={styles.groupToggle}
                  onClick={() => toggleGroup(group.label)}
                  aria-expanded={expanded}
                  aria-controls={groupId}
                >
                  <span className={styles.groupLabel}>{group.label}</span>
                  <DisclosureIcon className={[styles.groupChevron, expanded && styles.groupChevronOpen].filter(Boolean).join(' ')} />
                </button>
              )}

              <div
                id={groupId}
                className={[styles.groupItems, expanded && styles.groupItemsOpen].filter(Boolean).join(' ')}
              >
                <div className={styles.groupItemsInner}>
                  {group.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onNavigate}
                      aria-label={item.label}
                      className={({ isActive }) => [styles.item, isActive && styles.itemActive].filter(Boolean).join(' ')}
                      onMouseEnter={(e) => showTooltip(e, item.label)}
                      onMouseLeave={hideTooltip}
                      onFocus={(e) => showTooltip(e, item.label)}
                      onBlur={hideTooltip}
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
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.item}
          onClick={onLogout}
          aria-label="Sair"
          onMouseEnter={(e) => showTooltip(e, 'Sair')}
          onMouseLeave={hideTooltip}
          onFocus={(e) => showTooltip(e, 'Sair')}
          onBlur={hideTooltip}
        >
          <span className={styles.itemIcon} aria-hidden="true">
            <LogoutIcon />
          </span>
          <span className={styles.itemLabel}>Sair</span>
        </button>
      </div>

      {/* Portal pro <body>: .sidebar tem overflow-x/y próprios (a
          transição de largura do colapso precisa deles), que cortariam
          um tooltip posicionado à direita do próprio trilho. Fixed +
          portal escapa de qualquer clipping ancestral, sem depender de
          nenhum overflow:visible que arriscaria vazar o resto do menu. */}
      {tooltip &&
        createPortal(
          <div className={styles.tooltip} role="tooltip" style={{ top: tooltip.top, left: tooltip.left }}>
            {tooltip.label}
          </div>,
          document.body
        )}
    </nav>
  );
}
