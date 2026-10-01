import ApiConnection from '../../core/services/ApiConnection';
import type { Transaction } from '../dashboard/api';

function assertSuccess<T extends { success: boolean; message?: string }>(data: T): T {
  if (!data.success) {
    throw new Error(data.message || 'Erro ao buscar dados.');
  }
  return data;
}

export type { Transaction };

export interface TransactionPayload {
  userId: string;
  tipo: 'Receita' | 'Despesa';
  valor: number;
  descricao: string;
  categoria: string;
  dataHora: string;
  accountId?: string;
  cardId?: string;
  parcelas?: number;
  split?: { participantes: Array<{ nome: string; valor: number; pago: boolean }> };
}

export async function createTransaction(payload: TransactionPayload) {
  const api = new ApiConnection();
  return assertSuccess(await api.post('/api/transactions', payload));
}

export async function updateTransaction(id: string, payload: Partial<TransactionPayload>) {
  const api = new ApiConnection();
  return assertSuccess(await api.put(`/api/transactions/${id}`, payload));
}

export async function deleteTransaction(id: string, userId: string) {
  const api = new ApiConnection();
  return assertSuccess(await api.delete(`/api/transactions/${id}`, { userId }));
}

// ── Gastos fixos / receita recorrente -- mesmo contrato, endpoints
// paralelos (fixed-expenses / fixed-incomes). Um tipo genérico com o
// nome do campo de dia (vencimento vs. recebimento) sendo a única
// diferença real entre os dois. ──────────────────────────────────────
export type RecurringKind = 'expense' | 'income';
export type RecurringStatus = 'paid' | 'due' | 'late';

export interface RecurringItem {
  id: string;
  nome: string;
  valor: number;
  categoria: string;
  dia: number;
  icone?: string;
  ativo: boolean;
  status: RecurringStatus;
}

const RECURRING_CONFIG: Record<RecurringKind, { path: string; listKey: string; itemKey: string; dayField: string }> = {
  expense: { path: 'fixed-expenses', listKey: 'fixedExpenses', itemKey: 'fixedExpense', dayField: 'diaVencimento' },
  income: { path: 'fixed-incomes', listKey: 'fixedIncomes', itemKey: 'fixedIncome', dayField: 'diaRecebimento' }
};

function normalizeRecurring(kind: RecurringKind, raw: any): RecurringItem {
  const cfg = RECURRING_CONFIG[kind];
  return {
    id: raw.id,
    nome: raw.nome,
    valor: raw.valor,
    categoria: raw.categoria,
    dia: raw[cfg.dayField],
    icone: raw.icone,
    ativo: raw.ativo,
    status: raw.status ?? 'due'
  };
}

export async function fetchRecurringItems(kind: RecurringKind, userId: string): Promise<RecurringItem[]> {
  const cfg = RECURRING_CONFIG[kind];
  const api = new ApiConnection();
  const data = assertSuccess(await api.get(`/api/${cfg.path}/${userId}`));
  const list = data[cfg.listKey] ?? [];
  return list.map((raw: any) => normalizeRecurring(kind, raw));
}

export interface RecurringItemInput {
  nome: string;
  valor: number;
  categoria: string;
  dia: number;
  icone?: string;
}

export async function createRecurringItem(kind: RecurringKind, userId: string, input: RecurringItemInput) {
  const cfg = RECURRING_CONFIG[kind];
  const api = new ApiConnection();
  return assertSuccess(
    await api.post(`/api/${cfg.path}`, { userId, nome: input.nome, valor: input.valor, categoria: input.categoria, [cfg.dayField]: input.dia, icone: input.icone })
  );
}

export async function updateRecurringItem(kind: RecurringKind, userId: string, id: string, input: RecurringItemInput) {
  const cfg = RECURRING_CONFIG[kind];
  const api = new ApiConnection();
  return assertSuccess(
    await api.put(`/api/${cfg.path}/${id}`, { userId, nome: input.nome, valor: input.valor, categoria: input.categoria, [cfg.dayField]: input.dia, icone: input.icone })
  );
}

export async function deleteRecurringItem(kind: RecurringKind, userId: string, id: string) {
  const cfg = RECURRING_CONFIG[kind];
  const api = new ApiConnection();
  return assertSuccess(await api.delete(`/api/${cfg.path}/${id}`, { userId }));
}

export async function launchRecurringItem(kind: RecurringKind, userId: string, id: string) {
  const cfg = RECURRING_CONFIG[kind];
  const api = new ApiConnection();
  return assertSuccess(await api.post(`/api/${cfg.path}/${id}/lancar`, { userId }));
}

// ── Importação de extrato ──────────────────────────────────────────
export interface ImportPreviewRow {
  externalId: string | null;
  data: string;
  descricao: string;
  valor: number;
  tipo: 'receita' | 'despesa';
  categoriaSugerida: string;
  jaImportada: boolean;
}

export async function previewImport(formato: 'ofx' | 'csv', file: File): Promise<ImportPreviewRow[]> {
  const token = localStorage.getItem('token');
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const formData = new FormData();
  formData.append('arquivo', file);

  const res = await fetch(`${baseURL}/api/transactions/import/preview?formato=${formato}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData
  });
  const data = await res.json();
  return assertSuccess(data).transactions;
}

export interface ImportConfirmRow {
  externalId: string | null;
  data: string;
  descricao: string;
  categoria: string;
  valor: number;
  tipo: 'receita' | 'despesa';
  accountId?: string;
}

export async function confirmImport(transactions: ImportConfirmRow[]) {
  const api = new ApiConnection();
  return assertSuccess(await api.post('/api/transactions/import/confirm', { transactions }));
}
