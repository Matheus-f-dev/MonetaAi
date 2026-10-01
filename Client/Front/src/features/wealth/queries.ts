import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUserId } from '../dashboard/queries';
import {
  createAccount,
  createBudget,
  createCard,
  createGoal,
  createInvestment,
  deleteAccount,
  deleteBudget,
  deleteCard,
  deleteGoal,
  deleteInvestment,
  fetchAccountResumo,
  fetchAccounts,
  fetchBudgetStatus,
  fetchCardInvoice,
  fetchCards,
  fetchGoalProgress,
  fetchInvestments,
  fetchReconciliationHistory,
  reconcileAccount,
  transferBetweenAccounts,
  updateAccount,
  updateBudget,
  updateCard,
  updateGoal,
  updateInvestment,
  type AccountInput,
  type BudgetInput,
  type CardInput,
  type GoalInput,
  type InvestmentInput,
  type TransferInput
} from './api';

export { useCurrentUserId };

// ── Contas ──────────────────────────────────────────────────────────
export function useAccountsQuery(userId: string | null) {
  return useQuery({
    queryKey: ['accounts', userId],
    queryFn: () => fetchAccounts(userId as string),
    enabled: Boolean(userId)
  });
}

export function useAccountResumoQuery(userId: string | null) {
  return useQuery({
    queryKey: ['accounts-resumo', userId],
    queryFn: () => fetchAccountResumo(userId as string),
    enabled: Boolean(userId)
  });
}

// Uma conta nova/editada/removida também pode mudar o progresso de metas
// vinculadas a ela (Fase 4) e, no caso de transferência, cria transações de
// verdade -- por isso invalida tudo que depende de saldo, não só a lista de
// contas. Mesmo espírito do useInvalidateTransactionData da Fase 3.
function useInvalidateAccountData() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['accounts', userId] });
    queryClient.invalidateQueries({ queryKey: ['accounts-resumo', userId] });
    queryClient.invalidateQueries({ queryKey: ['goals-progress', userId] });
  };
}

function useInvalidateTransactionSideEffects() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['transactions', userId] });
    queryClient.invalidateQueries({ queryKey: ['balance', userId] });
    queryClient.invalidateQueries({ queryKey: ['chart-data', userId] });
    queryClient.invalidateQueries({ queryKey: ['projection', userId] });
  };
}

export function useCreateAccountMutation() {
  const invalidate = useInvalidateAccountData();
  return useMutation({
    mutationFn: (input: AccountInput) => createAccount(input),
    onSuccess: invalidate
  });
}

export function useUpdateAccountMutation() {
  const invalidate = useInvalidateAccountData();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AccountInput }) => updateAccount(id, input),
    onSuccess: invalidate
  });
}

export function useDeleteAccountMutation() {
  const invalidate = useInvalidateAccountData();
  return useMutation({
    mutationFn: (id: string) => deleteAccount(id),
    onSuccess: invalidate
  });
}

// Transferência grava duas transações de verdade -- precisa invalidar tanto
// o lado de contas/metas quanto o lado de movimentações/dashboard.
export function useTransferMutation() {
  const userId = useCurrentUserId();
  const invalidateAccounts = useInvalidateAccountData();
  const invalidateTransactions = useInvalidateTransactionSideEffects();
  return useMutation({
    mutationFn: (input: TransferInput) => transferBetweenAccounts(userId as string, input),
    onSuccess: () => {
      invalidateAccounts();
      invalidateTransactions();
    }
  });
}

export function useReconciliationHistoryQuery(accountId: string | null) {
  const userId = useCurrentUserId();
  return useQuery({
    queryKey: ['reconciliations', accountId],
    queryFn: () => fetchReconciliationHistory(userId as string, accountId as string),
    enabled: Boolean(userId) && Boolean(accountId)
  });
}

export function useReconcileMutation() {
  const userId = useCurrentUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, saldoInformado }: { accountId: string; saldoInformado: number }) =>
      reconcileAccount(userId as string, accountId, saldoInformado),
    onSuccess: (_, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: ['reconciliations', accountId] });
    }
  });
}

// ── Cartões ─────────────────────────────────────────────────────────
export function useCardsQuery(userId: string | null) {
  return useQuery({
    queryKey: ['cards', userId],
    queryFn: () => fetchCards(userId as string),
    enabled: Boolean(userId)
  });
}

export function useCardInvoiceQuery(cardId: string | null) {
  const userId = useCurrentUserId();
  return useQuery({
    queryKey: ['card-invoice', cardId],
    queryFn: () => fetchCardInvoice(userId as string, cardId as string),
    enabled: Boolean(userId) && Boolean(cardId)
  });
}

function useInvalidateCardData() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['cards', userId] });
    queryClient.invalidateQueries({ queryKey: ['accounts-resumo', userId] });
  };
}

export function useCreateCardMutation() {
  const invalidate = useInvalidateCardData();
  return useMutation({
    mutationFn: (input: CardInput) => createCard(input),
    onSuccess: invalidate
  });
}

export function useUpdateCardMutation() {
  const invalidate = useInvalidateCardData();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CardInput }) => updateCard(id, input),
    onSuccess: invalidate
  });
}

export function useDeleteCardMutation() {
  const invalidate = useInvalidateCardData();
  return useMutation({
    mutationFn: (id: string) => deleteCard(id),
    onSuccess: invalidate
  });
}

// ── Orçamento por categoria ─────────────────────────────────────────
export function useBudgetStatusQuery(userId: string | null) {
  return useQuery({
    queryKey: ['budgets-status', userId],
    queryFn: () => fetchBudgetStatus(userId as string),
    enabled: Boolean(userId)
  });
}

function useInvalidateBudgets() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();
  return () => queryClient.invalidateQueries({ queryKey: ['budgets-status', userId] });
}

export function useCreateBudgetMutation() {
  const invalidate = useInvalidateBudgets();
  return useMutation({
    mutationFn: (input: BudgetInput) => createBudget(input),
    onSuccess: invalidate
  });
}

export function useUpdateBudgetMutation() {
  const invalidate = useInvalidateBudgets();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: BudgetInput }) => updateBudget(id, input),
    onSuccess: invalidate
  });
}

export function useDeleteBudgetMutation() {
  const invalidate = useInvalidateBudgets();
  return useMutation({
    mutationFn: (id: string) => deleteBudget(id),
    onSuccess: invalidate
  });
}

// ── Metas financeiras ───────────────────────────────────────────────
export function useGoalsProgressQuery(userId: string | null) {
  return useQuery({
    queryKey: ['goals-progress', userId],
    queryFn: () => fetchGoalProgress(userId as string),
    enabled: Boolean(userId)
  });
}

function useInvalidateGoals() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();
  return () => queryClient.invalidateQueries({ queryKey: ['goals-progress', userId] });
}

export function useCreateGoalMutation() {
  const invalidate = useInvalidateGoals();
  return useMutation({
    mutationFn: (input: GoalInput) => createGoal(input),
    onSuccess: invalidate
  });
}

export function useUpdateGoalMutation() {
  const invalidate = useInvalidateGoals();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: GoalInput }) => updateGoal(id, input),
    onSuccess: invalidate
  });
}

export function useDeleteGoalMutation() {
  const invalidate = useInvalidateGoals();
  return useMutation({
    mutationFn: (id: string) => deleteGoal(id),
    onSuccess: invalidate
  });
}

// ── Investimentos ───────────────────────────────────────────────────
export function useInvestmentsQuery(userId: string | null) {
  return useQuery({
    queryKey: ['investments', userId],
    queryFn: () => fetchInvestments(userId as string),
    enabled: Boolean(userId)
  });
}

function useInvalidateInvestments() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();
  return () => queryClient.invalidateQueries({ queryKey: ['investments', userId] });
}

export function useCreateInvestmentMutation() {
  const invalidate = useInvalidateInvestments();
  return useMutation({
    mutationFn: (input: InvestmentInput) => createInvestment(input),
    onSuccess: invalidate
  });
}

export function useUpdateInvestmentMutation() {
  const invalidate = useInvalidateInvestments();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: InvestmentInput }) => updateInvestment(id, input),
    onSuccess: invalidate
  });
}

export function useDeleteInvestmentMutation() {
  const invalidate = useInvalidateInvestments();
  return useMutation({
    mutationFn: (id: string) => deleteInvestment(id),
    onSuccess: invalidate
  });
}
