import { useState, type FormEvent } from 'react';
import { Badge, Button, Card, Input, Modal, QueryState, Select, Skeleton } from '../../design-system';
import { useToast } from '../../presentation/hooks/useToast';
import { CATEGORIES } from '../../shared/categories';
import type { Alert, AlertCondition } from './api';
import { useAlertsQuery, useCreateAlertMutation, useCurrentUserId, useDeleteAlertMutation, useUpdateAlertMutation } from './queries';
import styles from './AlertsPage.module.css';

const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c, label: c }));
const CONDITION_OPTIONS: { value: AlertCondition; label: string }[] = [
  { value: 'Maior que', label: 'Maior que' },
  { value: 'Menor que', label: 'Menor que' },
  { value: 'Igual a', label: 'Igual a' }
];

const emptyForm = { nome: '', condicao: 'Maior que' as AlertCondition, categoria: '', valor: '' };

/**
 * Fase 5 -- Alertas personalizados, reconstruído dentro do AppShell. O
 * disparo em si continua sendo o Observer do backend (AlertObserver.js,
 * roda a cada transação criada e grava em `notifications`) -- esta tela
 * só cuida do CRUD da regra. O aviso em tempo real de quando um alerta
 * dispara é o NotificationsBell (app-shell), sempre visível, não só
 * nesta tela.
 */
export default function AlertsPage() {
  const userId = useCurrentUserId();
  const { addToast } = useToast();

  const alertsQuery = useAlertsQuery(userId);
  const createMutation = useCreateAlertMutation();
  const updateMutation = useUpdateAlertMutation();
  const deleteMutation = useDeleteAlertMutation();

  const alerts = alertsQuery.data ?? [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Alert | null>(null);
  const [form, setForm] = useState(emptyForm);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(alert: Alert) {
    setEditing(alert);
    setForm({ nome: alert.nome, condicao: alert.condicao, categoria: alert.categoria, valor: String(alert.valor) });
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.nome || !form.categoria || !form.valor) {
      addToast('Preencha todos os campos', 'error');
      return;
    }
    const input = { nome: form.nome, condicao: form.condicao, categoria: form.categoria, valor: parseFloat(form.valor) || 0 };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input });
        addToast('Alerta atualizado com sucesso!', 'success');
      } else {
        await createMutation.mutateAsync(input);
        addToast('Alerta criado com sucesso!', 'success');
      }
      setModalOpen(false);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao salvar alerta', 'error');
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Excluir este alerta?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      addToast('Alerta excluído com sucesso!', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao excluir alerta', 'error');
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Alertas</h1>
          <p className={styles.subtitle}>Avise quando uma categoria passar (ou ficar abaixo) de um valor no mês</p>
        </div>
        <Button onClick={openNew}>+ Novo alerta</Button>
      </div>

      <QueryState
        isLoading={alertsQuery.isLoading}
        isError={alertsQuery.isError}
        isEmpty={!alertsQuery.isLoading && !alertsQuery.isError && alerts.length === 0}
        onRetry={alertsQuery.refetch}
        skeleton={
          <div className={styles.list}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height="4rem" />
            ))}
          </div>
        }
        emptyTitle="Nenhum alerta configurado"
        emptyDescription="Crie um alerta pra ser avisado quando uma categoria passar de um valor no mês (ex: Lazer maior que R$ 300)."
      >
        <div className={styles.list}>
          {alerts.map((alert) => (
            <Card key={alert.id} padding="sm">
              <div className={styles.item}>
                <div>
                  <div className={styles.itemName}>{alert.nome}</div>
                  <div className={styles.itemMeta}>
                    <Badge tone="neutral">{alert.categoria}</Badge>
                    {alert.condicao.toLowerCase()} {alert.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
                <div className={styles.itemActions}>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(alert)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(alert.id)}>
                    Excluir
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </QueryState>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar alerta' : 'Novo alerta'}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Nome do alerta"
            placeholder="Ex: Limite de gastos mensal"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            required
          />
          <Select
            label="Condição"
            options={CONDITION_OPTIONS}
            value={form.condicao}
            onChange={(e) => setForm({ ...form, condicao: e.target.value as AlertCondition })}
          />
          <Select
            label="Categoria"
            placeholder="Selecione uma categoria"
            options={CATEGORY_OPTIONS}
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            required
          />
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
