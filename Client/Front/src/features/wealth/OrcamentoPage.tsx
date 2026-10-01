import { useState, type FormEvent } from 'react';
import { Badge, Button, Card, Input, Modal, MoneyFigure, QueryState, Select, Skeleton } from '../../design-system';
import { useToast } from '../../presentation/hooks/useToast';
import { CATEGORIES } from '../../shared/categories';
import type { BudgetStatus } from './api';
import { useBudgetStatusQuery, useCreateBudgetMutation, useCurrentUserId, useDeleteBudgetMutation, useUpdateBudgetMutation } from './queries';
import styles from './OrcamentoPage.module.css';

const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c, label: c }));
const emptyForm = { categoria: '', limiteMensal: '' };

/**
 * Fase 4 -- Orçamento por categoria (FRONTEND_TODO.md item 5, novo:
 * backend já pronto, tela nunca existiu). Um limite mensal por categoria;
 * o status (`/budgets/:userId/status`) já vem com quanto foi gasto no mês
 * corrente naquela categoria, sem recalcular nada aqui.
 */
export default function OrcamentoPage() {
  const userId = useCurrentUserId();
  const { addToast } = useToast();

  const statusQuery = useBudgetStatusQuery(userId);
  const createMutation = useCreateBudgetMutation();
  const updateMutation = useUpdateBudgetMutation();
  const deleteMutation = useDeleteBudgetMutation();

  const budgets = statusQuery.data ?? [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetStatus | null>(null);
  const [form, setForm] = useState(emptyForm);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(budget: BudgetStatus) {
    setEditing(budget);
    setForm({ categoria: budget.categoria, limiteMensal: String(budget.limiteMensal) });
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.categoria || !form.limiteMensal) {
      addToast('Escolha a categoria e o limite mensal', 'error');
      return;
    }
    const input = { categoria: form.categoria, limiteMensal: parseFloat(form.limiteMensal) || 0 };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input });
        addToast('Orçamento atualizado com sucesso!', 'success');
      } else {
        await createMutation.mutateAsync(input);
        addToast('Orçamento criado com sucesso!', 'success');
      }
      setModalOpen(false);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao salvar orçamento', 'error');
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Remover este orçamento?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      addToast('Orçamento removido com sucesso', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao remover orçamento', 'error');
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Orçamento</h1>
          <p className={styles.subtitle}>Defina um limite mensal por categoria e acompanhe se está estourando</p>
        </div>
        <Button onClick={openNew}>+ Novo orçamento</Button>
      </div>

      <QueryState
        isLoading={statusQuery.isLoading}
        isError={statusQuery.isError}
        isEmpty={!statusQuery.isLoading && !statusQuery.isError && budgets.length === 0}
        onRetry={statusQuery.refetch}
        skeleton={
          <div className={styles.list}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height="5.5rem" />
            ))}
          </div>
        }
        emptyTitle="Nenhum orçamento definido"
        emptyDescription="Defina um limite mensal por categoria (ex: R$ 600 em Alimentação) pra saber quando está estourando."
      >
        <div className={styles.list}>
          {budgets.map((budget) => {
            const clamped = Math.min(budget.percentualUsado, 100);
            return (
              <Card key={budget.id} padding="sm">
                <div className={styles.item}>
                  <div className={styles.itemHeader}>
                    <span className={styles.categoria}>{budget.categoria}</span>
                    <Badge tone={budget.estourado ? 'negative' : 'neutral'} withDot={budget.estourado}>
                      {budget.estourado ? 'estourado' : `${budget.percentualUsado.toFixed(0)}%`}
                    </Badge>
                  </div>
                  <div className={styles.track}>
                    <div className={[styles.fill, budget.estourado && styles.fillOver].filter(Boolean).join(' ')} style={{ width: `${clamped}%` }} />
                  </div>
                  <div className={styles.footer}>
                    <span>
                      <MoneyFigure value={budget.gastoNoMes} sign="neutral" size="sm" /> de{' '}
                      <MoneyFigure value={budget.limiteMensal} sign="neutral" size="sm" />
                    </span>
                    <div className={styles.itemActions}>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(budget)}>
                        Editar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(budget.id)}>
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </QueryState>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar orçamento' : 'Novo orçamento'}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Select
            label="Categoria"
            placeholder="Selecione uma categoria"
            options={CATEGORY_OPTIONS}
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            required
          />
          <Input
            label="Limite mensal (R$)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={form.limiteMensal}
            onChange={(e) => setForm({ ...form, limiteMensal: e.target.value })}
            required
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
