import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTransactions } from '../dashboard/api';
import { useCurrentUserId } from '../dashboard/queries';
import {
  confirmImport,
  createRecurringItem,
  createTransaction,
  deleteRecurringItem,
  deleteTransaction,
  fetchRecurringItems,
  launchRecurringItem,
  previewImport,
  updateRecurringItem,
  updateTransaction,
  type ImportConfirmRow,
  type RecurringItemInput,
  type RecurringKind,
  type TransactionPayload
} from './api';

export { useCurrentUserId };

export function useTransactionsQuery(userId: string | null) {
  return useQuery({
    queryKey: ['transactions', userId],
    queryFn: () => fetchTransactions(userId as string),
    enabled: Boolean(userId)
  });
}

// Toda mutação de transação invalida não só a própria lista, mas tudo que
// o dashboard (Fase 2) calcula em cima dela -- sem isso, criar um gasto
// aqui deixaria o dashboard mostrando saldo/gráfico desatualizados até
// o staleTime de 30s expirar sozinho.
function useInvalidateTransactionData() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
    queryClient.invalidateQueries({ queryKey: ['balance', userId] });
    queryClient.invalidateQueries({ queryKey: ['chart-data', userId] });
    queryClient.invalidateQueries({ queryKey: ['projection', userId] });
  };
}

export function useCreateTransactionMutation() {
  const invalidate = useInvalidateTransactionData();
  return useMutation({
    mutationFn: (payload: TransactionPayload) => createTransaction(payload),
    onSuccess: invalidate
  });
}

export function useUpdateTransactionMutation() {
  const invalidate = useInvalidateTransactionData();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TransactionPayload> }) => updateTransaction(id, payload),
    onSuccess: invalidate
  });
}

export function useDeleteTransactionMutation() {
  const invalidate = useInvalidateTransactionData();
  const userId = useCurrentUserId();
  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id, userId as string),
    onSuccess: invalidate
  });
}

// ── Gastos fixos / receita recorrente ──────────────────────────────
export function useRecurringItemsQuery(kind: RecurringKind, userId: string | null) {
  return useQuery({
    queryKey: ['recurring', kind, userId],
    queryFn: () => fetchRecurringItems(kind, userId as string),
    enabled: Boolean(userId)
  });
}

function useInvalidateRecurring(kind: RecurringKind) {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();
  return () => queryClient.invalidateQueries({ queryKey: ['recurring', kind, userId] });
}

export function useCreateRecurringMutation(kind: RecurringKind) {
  const userId = useCurrentUserId();
  const invalidate = useInvalidateRecurring(kind);
  return useMutation({
    mutationFn: (input: RecurringItemInput) => createRecurringItem(kind, userId as string, input),
    onSuccess: invalidate
  });
}

export function useUpdateRecurringMutation(kind: RecurringKind) {
  const userId = useCurrentUserId();
  const invalidate = useInvalidateRecurring(kind);
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RecurringItemInput }) => updateRecurringItem(kind, userId as string, id, input),
    onSuccess: invalidate
  });
}

export function useDeleteRecurringMutation(kind: RecurringKind) {
  const userId = useCurrentUserId();
  const invalidate = useInvalidateRecurring(kind);
  return useMutation({
    mutationFn: (id: string) => deleteRecurringItem(kind, userId as string, id),
    onSuccess: invalidate
  });
}

export function useLaunchRecurringMutation(kind: RecurringKind) {
  const userId = useCurrentUserId();
  const invalidateRecurring = useInvalidateRecurring(kind);
  const invalidateTransactions = useInvalidateTransactionData();
  return useMutation({
    mutationFn: (id: string) => launchRecurringItem(kind, userId as string, id),
    onSuccess: () => {
      invalidateRecurring();
      invalidateTransactions();
    }
  });
}

// ── Importação de extrato ──────────────────────────────────────────
export function usePreviewImportMutation() {
  return useMutation({
    mutationFn: ({ formato, file }: { formato: 'ofx' | 'csv-nubank'; file: File }) => previewImport(formato, file)
  });
}

export function useConfirmImportMutation() {
  const invalidate = useInvalidateTransactionData();
  return useMutation({
    mutationFn: (transactions: ImportConfirmRow[]) => confirmImport(transactions),
    onSuccess: invalidate
  });
}
