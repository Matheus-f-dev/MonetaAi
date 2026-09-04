import { useEffect, useRef, useState } from 'react';
import { useNotificationsQuery, useCurrentUserId } from '../features/alerts/queries';
import type { AlertNotification } from '../features/alerts/api';
import { useToast } from '../presentation/hooks/useToast';
import { BellIcon } from './icons';
import styles from './NotificationsBell.module.css';

const TOASTED_KEY = 'moneta-toasted-notifications';
const SEEN_KEY = 'moneta-seen-notifications';
const MAX_TRACKED = 200;

function readIdSet(key: string): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || '[]');
    return new Set(Array.isArray(raw) ? raw : []);
  } catch {
    return new Set();
  }
}

function writeIdSet(key: string, ids: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...ids].slice(-MAX_TRACKED)));
  } catch {
    // localStorage indisponível (aba privada, storage cheio) -- degrada
    // pra "sempre novo", sem quebrar o resto do sino.
  }
}

function brl(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Fase 5 -- substitui o `useAlertNotifications` que existia só na tela
 * antiga de dashboard (`system.jsx`, fora de rota desde a Fase 2 --
 * achado real: nenhum lugar do app redesenhado ainda avisava sobre
 * alerta disparado). Fica no Topbar, dentro do AppShell -- roda em toda
 * página do app novo, não só numa tela específica.
 *
 * Não existe push (WebSocket/SSE) no backend, então "tempo real" é
 * polling (useNotificationsQuery, 60s). `lido` na tabela `notifications`
 * nunca é setado por nenhuma rota hoje -- em vez de expor isso (sempre
 * "não lido" pra sempre), o sino rastreia local (localStorage) o que já
 * apareceu como toast e o que já foi "visto" (dropdown aberto), sem
 * precisar de rota nova no backend.
 */
export function NotificationsBell() {
  const userId = useCurrentUserId();
  const { addToast } = useToast();
  const notificationsQuery = useNotificationsQuery(userId);
  const [open, setOpen] = useState(false);
  const toastedRef = useRef<Set<string>>(readIdSet(TOASTED_KEY));
  const [seenIds, setSeenIds] = useState<Set<string>>(() => readIdSet(SEEN_KEY));

  const notifications = notificationsQuery.data ?? [];

  useEffect(() => {
    if (notifications.length === 0) return;
    const toasted = toastedRef.current;
    const newOnes = notifications.filter((n) => !toasted.has(n.id));
    if (newOnes.length === 0) return;

    newOnes.forEach((n) => {
      addToast(`🚨 ${n.nomeAlerta}: ${n.categoria} ${n.condicao.toLowerCase()} ${brl(n.limite)}. Total: ${brl(n.totalGasto)}`, 'warning');
      toasted.add(n.id);
    });
    writeIdSet(TOASTED_KEY, toasted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications.map((n) => n.id).join(',')]);

  const unreadCount = notifications.filter((n) => !seenIds.has(n.id)).length;

  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next && notifications.length > 0) {
      const updated = new Set(seenIds);
      notifications.forEach((n) => updated.add(n.id));
      setSeenIds(updated);
      writeIdSet(SEEN_KEY, updated);
    }
  }

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.iconButton}
        onClick={handleToggle}
        aria-label={unreadCount > 0 ? `Notificações (${unreadCount} não vistas)` : 'Notificações'}
      >
        <BellIcon width={18} height={18} />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <>
          <div className={styles.overlay} onClick={() => setOpen(false)} aria-hidden="true" />
          <div className={styles.dropdown} role="dialog" aria-label="Notificações">
            <p className={styles.dropdownTitle}>Notificações</p>
            {notifications.length === 0 ? (
              <p className={styles.empty}>Nenhum alerta disparado ainda.</p>
            ) : (
              <ul className={styles.list}>
                {notifications.slice(0, 15).map((n) => (
                  <NotificationRow key={n.id} notification={n} />
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function NotificationRow({ notification }: { notification: AlertNotification }) {
  return (
    <li className={styles.item}>
      <p className={styles.itemTitle}>{notification.nomeAlerta}</p>
      <p className={styles.itemDetail}>
        {notification.categoria} {notification.condicao.toLowerCase()} {brl(notification.limite)} · total {brl(notification.totalGasto)}
      </p>
      <p className={styles.itemDate}>{new Date(notification.disparadoEm).toLocaleString('pt-BR')}</p>
    </li>
  );
}
