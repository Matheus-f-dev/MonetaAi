import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { QuickAddTransaction } from './QuickAddTransaction';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAppTheme } from './useAppTheme';
import { useSessionRefresh } from './useSessionRefresh';
import styles from './AppShell.module.css';

/**
 * Layout route do app logado -- sidebar + topbar persistentes, conteúdo
 * de cada rota entra via <Outlet/>. Só é o pai de rotas já reconstruídas
 * na nova identidade visual (a partir da Fase 2); as páginas antigas
 * continuam com o próprio layout interno intacto até serem reconstruídas
 * de verdade -- ver a nota em App.jsx pro raciocínio completo.
 */
const COLLAPSED_KEY = 'moneta-sidebar-collapsed';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  // Achado testando com o app de verdade: em monitor largo, a sidebar
  // sempre expandida some vertida numa fatia fixa de 248px que não dá
  // pra recuperar -- não tinha jeito nenhum de encolher pra ganhar
  // espaço pro conteúdo. Colapsa pra um trilho só de ícones (persistido
  // em localStorage, é preferência por dispositivo, não por conta).
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const { preference, toggle } = useAppTheme();
  useSessionRefresh();

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
      } catch {
        // localStorage indisponível -- o toggle ainda funciona pra
        // sessão atual, só não persiste pro próximo carregamento.
      }
      return next;
    });
  }

  // Fecha o drawer automaticamente se a viewport crescer pra desktop --
  // sem isso, redimensionar a janela com o drawer aberto deixava ele
  // "preso" aberto por cima do layout de duas colunas.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 901px)');
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setMobileOpen(false);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  function handleLogout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/';
  }

  return (
    <div className={`ds-scope ${styles.shell}`}>
      {mobileOpen && (
        <div className={styles.overlay} onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      <div className={[styles.sidebarSlot, mobileOpen && styles.sidebarSlotOpen].filter(Boolean).join(' ')}>
        <Sidebar onLogout={handleLogout} onNavigate={() => setMobileOpen(false)} collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
      </div>

      <div className={styles.main}>
        <Topbar
          onOpenMenu={() => setMobileOpen(true)}
          themePreference={preference}
          onToggleTheme={toggle}
        />
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>

      <QuickAddTransaction />
    </div>
  );
}
