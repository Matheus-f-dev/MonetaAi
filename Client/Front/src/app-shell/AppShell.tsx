import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAppTheme } from './useAppTheme';
import styles from './AppShell.module.css';

/**
 * Layout route do app logado -- sidebar + topbar persistentes, conteúdo
 * de cada rota entra via <Outlet/>. Só é o pai de rotas já reconstruídas
 * na nova identidade visual (a partir da Fase 2); as páginas antigas
 * continuam com o próprio layout interno intacto até serem reconstruídas
 * de verdade -- ver a nota em App.jsx pro raciocínio completo.
 */
export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { preference, toggle } = useAppTheme();

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
        <Sidebar onLogout={handleLogout} onNavigate={() => setMobileOpen(false)} />
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
    </div>
  );
}
