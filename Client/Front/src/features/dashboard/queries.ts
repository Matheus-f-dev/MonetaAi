import { useQuery } from '@tanstack/react-query';
import {
  fetchBalance,
  fetchChartData,
  fetchFixedExpenses,
  fetchProjection,
  fetchTransactions,
  fetchUserProfile,
  type Transaction
} from './api';

export function useCurrentUserId(): string | null {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.uid ?? null;
  } catch {
    return null;
  }
}

export function useBalanceQuery(userId: string | null) {
  return useQuery({
    queryKey: ['balance', userId],
    queryFn: () => fetchBalance(userId as string),
    enabled: Boolean(userId)
  });
}

export function useChartDataQuery(userId: string | null, filter: string) {
  return useQuery({
    queryKey: ['chart-data', userId, filter],
    queryFn: () => fetchChartData(userId as string, filter),
    enabled: Boolean(userId)
  });
}

export function useTransactionsQuery(userId: string | null) {
  return useQuery({
    queryKey: ['transactions', userId],
    queryFn: () => fetchTransactions(userId as string),
    enabled: Boolean(userId)
  });
}

export function useUserProfileQuery(userId: string | null) {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => fetchUserProfile(userId as string),
    enabled: Boolean(userId)
  });
}

export function useFixedExpensesQuery(userId: string | null) {
  return useQuery({
    queryKey: ['fixed-expenses', userId],
    queryFn: () => fetchFixedExpenses(userId as string),
    enabled: Boolean(userId)
  });
}

// Depende das transações já carregadas (o backend recalcula a projeção a
// partir da lista, não busca do banco de novo) -- por isso a query fica
// desabilitada até `transactions` chegar, e cacheia junto com userId+lista.
export function useProjectionQuery(userId: string | null, transactions: Transaction[] | undefined, meses = 6) {
  return useQuery({
    queryKey: ['projection', userId, meses, transactions?.length],
    queryFn: () => fetchProjection(meses, transactions as Transaction[]),
    enabled: Boolean(userId) && Array.isArray(transactions)
  });
}
