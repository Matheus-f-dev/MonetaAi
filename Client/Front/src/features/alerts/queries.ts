import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUserId } from '../dashboard/queries';
import { createAlert, deleteAlert, fetchAlerts, fetchNotifications, updateAlert, type AlertInput } from './api';

export { useCurrentUserId };

export function useAlertsQuery(userId: string | null) {
  return useQuery({
    queryKey: ['alerts', userId],
    queryFn: () => fetchAlerts(userId as string),
    enabled: Boolean(userId)
  });
}

function useInvalidateAlerts() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();
  return () => queryClient.invalidateQueries({ queryKey: ['alerts', userId] });
}

export function useCreateAlertMutation() {
  const invalidate = useInvalidateAlerts();
  return useMutation({
    mutationFn: (input: AlertInput) => createAlert(input),
    onSuccess: invalidate
  });
}

export function useUpdateAlertMutation() {
  const invalidate = useInvalidateAlerts();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AlertInput }) => updateAlert(id, input),
    onSuccess: invalidate
  });
}

export function useDeleteAlertMutation() {
  const invalidate = useInvalidateAlerts();
  const userId = useCurrentUserId();
  return useMutation({
    mutationFn: (id: string) => deleteAlert(id, userId as string),
    onSuccess: invalidate
  });
}

// ── Notificações ──────────────────────────────────────────────────
// Não existe push de verdade (WebSocket/SSE) no backend -- "tempo real"
// aqui é polling: refetch a cada 60s revalida contra o que o
// AlertObserver (backend) gravou desde a última checagem, sem exigir
// nenhuma infra nova. O NotificationsBell (app-shell) que consome isso
// decide o que já foi mostrado como toast (dedupe em localStorage).
export function useNotificationsQuery(userId: string | null) {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => fetchNotifications(userId as string),
    enabled: Boolean(userId),
    refetchInterval: 60_000
  });
}
