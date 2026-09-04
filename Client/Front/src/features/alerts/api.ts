import ApiConnection from '../../core/services/ApiConnection';

function assertSuccess<T extends { success: boolean; message?: string }>(data: T): T {
  if (!data.success) {
    throw new Error(data.message || 'Erro ao buscar dados.');
  }
  return data;
}

export type AlertCondition = 'Maior que' | 'Menor que' | 'Igual a';

export interface Alert {
  id: string;
  userId: string;
  nome: string;
  condicao: AlertCondition;
  valor: number;
  categoria: string;
  ativo: boolean;
}

export interface AlertInput {
  nome: string;
  condicao: AlertCondition;
  valor: number;
  categoria: string;
}

export async function fetchAlerts(userId: string): Promise<Alert[]> {
  const api = new ApiConnection();
  const data = assertSuccess(await api.get(`/api/alerts/${userId}`));
  return data.alerts ?? [];
}

export async function createAlert(input: AlertInput) {
  const api = new ApiConnection();
  return assertSuccess(await api.post('/api/alerts', input));
}

export async function updateAlert(id: string, input: AlertInput) {
  const api = new ApiConnection();
  return assertSuccess(await api.put(`/api/alerts/${id}`, input));
}

export async function deleteAlert(id: string, userId: string) {
  const api = new ApiConnection();
  return assertSuccess(await api.delete(`/api/alerts/${id}`, { userId }));
}

// ── Notificações (alertas já disparados) ────────────────────────────
export interface AlertNotification {
  id: string;
  userId: string;
  alerteId: string;
  nomeAlerta: string;
  categoria: string;
  limite: number;
  totalGasto: number;
  condicao: AlertCondition;
  disparadoEm: string;
  lido: boolean;
}

export async function fetchNotifications(userId: string): Promise<AlertNotification[]> {
  const api = new ApiConnection();
  const data = assertSuccess(await api.get(`/api/notifications/${userId}`));
  return data.notifications ?? [];
}
