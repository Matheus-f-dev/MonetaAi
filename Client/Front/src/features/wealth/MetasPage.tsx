import { useState, type FormEvent } from 'react';
import { Badge, Button, Card, Input, Modal, MoneyFigure, QueryState, Select, Skeleton } from '../../design-system';
import { useToast } from '../../presentation/hooks/useToast';
import type { GoalProgress } from './api';
import {
  useAccountsQuery,
  useCreateGoalMutation,
  useCurrentUserId,
  useDeleteGoalMutation,
  useGoalsProgressQuery,
  useUpdateGoalMutation
} from './queries';
import styles from './MetasPage.module.css';

const emptyForm = { nome: '', valorAlvo: '', prazo: '', accountId: '' };

/**
 * Fase 4 -- Metas financeiras (FRONTEND_TODO.md item 6, novo). O
 * progresso (`/goals/:userId/progress`) já vem calculado pelo backend a
 * partir do saldo real da conta vinculada (ou do patrimônio total, se a
 * meta não estiver amarrada a nenhuma conta específica) -- não recalcula
 * nada aqui.
 */
export default function MetasPage() {
  const userId = useCurrentUserId();
  const { addToast } = useToast();

  const goalsQuery = useGoalsProgressQuery(userId);
  const accountsQuery = useAccountsQuery(userId);
  const createMutation = useCreateGoalMutation();
  const updateMutation = useUpdateGoalMutation();
  const deleteMutation = useDeleteGoalMutation();

  const goals = goalsQuery.data ?? [];
  const accounts = accountsQuery.data ?? [];
  const accountOptions = accounts.map((a) => ({ value: a.id, label: a.nome }));

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GoalProgress | null>(null);
  const [form, setForm] = useState(emptyForm);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(goal: GoalProgress) {
    setEditing(goal);
    setForm({
      nome: goal.nome,
      valorAlvo: String(goal.valorAlvo),
      prazo: goal.prazo ? goal.prazo.slice(0, 10) : '',
      accountId: goal.accountId || ''
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.nome || !form.valorAlvo) {
      addToast('Dê um nome e um valor alvo pra meta', 'error');
      return;
    }
    const input = {
      nome: form.nome,
      valorAlvo: parseFloat(form.valorAlvo) || 0,
      prazo: form.prazo || undefined,
      accountId: form.accountId || undefined
    };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input });
        addToast('Meta atualizada com sucesso!', 'success');
      } else {
        await createMutation.mutateAsync(input);
        addToast('Meta criada com sucesso!', 'success');
      }
      setModalOpen(false);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao salvar meta', 'error');
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Remover esta meta?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      addToast('Meta removida com sucesso', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao remover meta', 'error');
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Metas</h1>
          <p className={styles.subtitle}>Acompanhe o quanto falta pra cada objetivo</p>
        </div>
        <Button onClick={openNew}>+ Nova meta</Button>
      </div>

      <QueryState
        isLoading={goalsQuery.isLoading}
        isError={goalsQuery.isError}
        isEmpty={!goalsQuery.isLoading && !goalsQuery.isError && goals.length === 0}
        onRetry={goalsQuery.refetch}
        skeleton={
          <div className={styles.grid}>
            {[0, 1].map((i) => (
              <Skeleton key={i} height="8rem" />
            ))}
          </div>
        }
        emptyTitle="Nenhuma meta cadastrada"
        emptyDescription="Defina um objetivo (ex: reserva de emergência, viagem) e acompanhe o progresso a partir do saldo real das suas contas."
      >
        <div className={styles.grid}>
          {goals.map((goal) => {
            const clamped = Math.min(goal.percentualAtingido, 100);
            const account = accounts.find((a) => a.id === goal.accountId);
            return (
              <Card key={goal.id} perforated>
                <div className={styles.cardTop}>
                  <span className={styles.nome}>{goal.nome}</span>
                  {goal.concluida && (
                    <Badge tone="positive" withDot>
                      concluída
                    </Badge>
                  )}
                </div>
                {(account || goal.prazo) && (
                  <div className={styles.meta}>
                    {account ? account.nome : 'Patrimônio total'}
                    {goal.prazo && ` · até ${new Date(goal.prazo).toLocaleDateString('pt-BR')}`}
                  </div>
                )}
                <div className={styles.track}>
                  <div className={[styles.fill, goal.concluida && styles.fillDone].filter(Boolean).join(' ')} style={{ width: `${clamped}%` }} />
                </div>
                <div className={styles.footer}>
                  <span>
                    <MoneyFigure value={goal.saldoAtual} sign="neutral" size="sm" /> de{' '}
                    <MoneyFigure value={goal.valorAlvo} sign="neutral" size="sm" />
                  </span>
                  <span className={styles.percent}>{goal.percentualAtingido.toFixed(0)}%</span>
                </div>
                <div className={styles.cardActions}>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(goal)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(goal.id)}>
                    Excluir
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </QueryState>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar meta' : 'Nova meta'}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input label="Nome" placeholder="Ex: Reserva de emergência" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
          <Input
            label="Valor alvo (R$)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={form.valorAlvo}
            onChange={(e) => setForm({ ...form, valorAlvo: e.target.value })}
            required
          />
          <Input label="Prazo (opcional)" type="date" value={form.prazo} onChange={(e) => setForm({ ...form, prazo: e.target.value })} />
          <Select
            label="Conta vinculada (opcional)"
            placeholder="Patrimônio total (todas as contas)"
            options={accountOptions}
            value={form.accountId}
            onChange={(e) => setForm({ ...form, accountId: e.target.value })}
          />
          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : editing ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
