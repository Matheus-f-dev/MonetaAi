import { useState, type FormEvent } from 'react';
import { Badge, Button, Card, Input, MoneyFigure, Modal, QueryState, Select, Skeleton } from '../../../design-system';
import { useToast } from '../../../presentation/hooks/useToast';
import { CATEGORIES } from '../../../shared/categories';
import type { RecurringItem, RecurringKind, RecurringStatus } from '../api';
import {
  useCreateRecurringMutation,
  useCurrentUserId,
  useDeleteRecurringMutation,
  useLaunchRecurringMutation,
  useRecurringItemsQuery,
  useUpdateRecurringMutation
} from '../queries';
import styles from './RecurringItemsPage.module.css';

const ICONES = ['🏠', '💡', '📶', '💧', '🎬', '💪', '📱', '🚗', '🎓', '🛡️', '💰', '📌'];
const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c, label: c }));

const STATUS_LABEL: Record<RecurringStatus, string> = { paid: 'Pago', due: 'A vencer', late: 'Atrasado' };
const STATUS_TONE: Record<RecurringStatus, 'positive' | 'neutral' | 'negative'> = { paid: 'positive', due: 'neutral', late: 'negative' };

const emptyForm = { nome: '', valor: '', categoria: '', dia: '5', icone: '🏠' };

export interface RecurringItemsPageProps {
  kind: RecurringKind;
  title: string;
  subtitle: (previsto: number, pago: number) => string;
  /** Verbo + "dia", ex.: "vence dia" / "recebe dia" -- compõe com o
   * número (`{dayVerb} 5`) e também rotula o campo do formulário
   * ("Dia de vencimento" / "Dia de recebimento"). */
  dayVerb: string;
  dayFieldLabel: string;
  emptyDescription: string;
  addLabel: string;
}

/**
 * Fase 3 -- serve Gastos Fixos (já existia) e Receita Recorrente (nova,
 * "espelha a tela de gastos fixos que já existe", per o handoff do
 * backend em FRONTEND_TODO.md). Um componente parametrizado por `kind`
 * em vez de duas telas quase idênticas.
 */
export function RecurringItemsPage({ kind, title, subtitle, dayVerb, dayFieldLabel, emptyDescription, addLabel }: RecurringItemsPageProps) {
  const userId = useCurrentUserId();
  const { addToast } = useToast();

  const itemsQuery = useRecurringItemsQuery(kind, userId);
  const createMutation = useCreateRecurringMutation(kind);
  const updateMutation = useUpdateRecurringMutation(kind);
  const deleteMutation = useDeleteRecurringMutation(kind);
  const launchMutation = useLaunchRecurringMutation(kind);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringItem | null>(null);
  const [form, setForm] = useState(emptyForm);

  const items = itemsQuery.data ?? [];
  const previsto = items.reduce((sum, f) => sum + (f.valor || 0), 0);
  const pago = items.filter((f) => f.status === 'paid').reduce((sum, f) => sum + (f.valor || 0), 0);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(item: RecurringItem) {
    setEditing(item);
    setForm({ nome: item.nome, valor: String(item.valor), categoria: item.categoria, dia: String(item.dia), icone: item.icone || '📌' });
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.nome || !form.valor || !form.dia) {
      addToast('Preencha nome, valor e o dia', 'error');
      return;
    }
    const input = { nome: form.nome, valor: parseFloat(form.valor), categoria: form.categoria, dia: parseInt(form.dia, 10), icone: form.icone };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input });
        addToast('Atualizado com sucesso!', 'success');
      } else {
        await createMutation.mutateAsync(input);
        addToast('Cadastrado com sucesso!', 'success');
      }
      setModalOpen(false);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao salvar', 'error');
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Remover? Os lançamentos já feitos não são apagados.')) return;
    try {
      await deleteMutation.mutateAsync(id);
      addToast('Removido com sucesso', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao remover', 'error');
    }
  }

  async function handleLaunch(id: string) {
    try {
      await launchMutation.mutateAsync(id);
      addToast('Lançado como transação do mês!', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao lançar', 'error');
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle(previsto, pago)}</p>
        </div>
        <Button onClick={openNew}>{addLabel}</Button>
      </div>

      <QueryState
        isLoading={itemsQuery.isLoading}
        isError={itemsQuery.isError}
        isEmpty={!itemsQuery.isLoading && !itemsQuery.isError && items.length === 0}
        onRetry={itemsQuery.refetch}
        skeleton={
          <div className={styles.list}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height="4.5rem" />
            ))}
          </div>
        }
        emptyTitle="Nada cadastrado ainda"
        emptyDescription={emptyDescription}
      >
        <div className={styles.list}>
          {items
            .slice()
            .sort((a, b) => a.dia - b.dia)
            .map((item) => (
              <Card key={item.id} padding="sm">
                <div className={styles.item}>
                  <div className={styles.icon}>{item.icone || '📌'}</div>
                  <div>
                    <div className={styles.name}>{item.nome}</div>
                    <div className={styles.meta}>
                      {item.categoria} · {dayVerb} {item.dia}
                    </div>
                  </div>
                  <MoneyFigure value={item.valor} sign="neutral" size="md" />
                  <Badge tone={STATUS_TONE[item.status]} withDot>
                    {STATUS_LABEL[item.status]}
                  </Badge>
                  <div className={styles.actions}>
                    {item.status !== 'paid' && (
                      <Button size="sm" onClick={() => handleLaunch(item.id)} disabled={launchMutation.isPending}>
                        Lançar agora
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => openEdit(item)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)}>
                      Excluir
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      </QueryState>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Editar ${title.toLowerCase()}` : addLabel}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Nome" placeholder="Ex: Aluguel" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
          <Input
            label="Valor (R$)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={form.valor}
            onChange={(e) => setForm({ ...form, valor: e.target.value })}
            required
          />
          <Select
            label="Categoria"
            placeholder="Selecione uma categoria"
            options={CATEGORY_OPTIONS}
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
          />
          <Input
            label={dayFieldLabel}
            type="number"
            min="1"
            max="28"
            value={form.dia}
            onChange={(e) => setForm({ ...form, dia: e.target.value })}
            required
          />
          <div>
            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', display: 'block', marginBottom: 8 }}>Ícone</label>
            <div className={styles.iconPicker}>
              {ICONES.map((ic) => (
                <button
                  type="button"
                  key={ic}
                  className={[styles.iconOption, form.icone === ic && styles.iconOptionActive].filter(Boolean).join(' ')}
                  onClick={() => setForm({ ...form, icone: ic })}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>
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
