import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Input,
  MoneyFigure,
  QueryState,
  Select,
  Skeleton,
  Table,
  TableNumericCell
} from '../../../design-system';
import { useAccounts } from '../../../presentation/hooks/useAccounts';
import { useCards } from '../../../presentation/hooks/useCards';
import { usePeople } from '../../../presentation/hooks/usePeople';
import { useToast } from '../../../presentation/hooks/useToast';
import observerService from '../../../core/services/ObserverService';
import type { Transaction, TransactionPayload } from '../api';
import {
  useCreateTransactionMutation,
  useCurrentUserId,
  useDeleteTransactionMutation,
  useTransactionsQuery,
  useUpdateTransactionMutation
} from '../queries';
import { TransactionModal, type EditingTransaction } from './TransactionModal';
import styles from './TransactionsListPage.module.css';

type Period = 'todas' | 'este-mes' | 'mes-passado';

function parseDate(t: Transaction): Date {
  const raw = t.dataHora || t.data || t.criadoEm;
  if (raw && typeof raw === 'string' && raw.includes('/')) {
    const [datePart] = raw.split(', ');
    const [day, month, year] = datePart.split('/');
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  return raw ? new Date(raw) : new Date(0);
}

function inPeriod(date: Date, period: Period): boolean {
  if (period === 'todas') return true;
  const now = new Date();
  if (period === 'este-mes') {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
}

export interface TransactionsListPageProps {
  tipo: 'despesa' | 'receita';
  title: string;
  subtitle: string;
  emptyDescription: string;
}

/**
 * Fase 3 -- serve Gastos e Receitas (o brief pede as duas telas; o
 * conteúdo é o mesmo filtrado por tipo, então é uma página só,
 * parametrizada, em vez de duas cópias quase idênticas).
 */
export function TransactionsListPage({ tipo, title, subtitle, emptyDescription }: TransactionsListPageProps) {
  const userId = useCurrentUserId();
  const { addToast } = useToast();
  const { accounts } = useAccounts(userId);
  const { cards } = useCards(userId);
  const { people } = usePeople(userId);

  const transactionsQuery = useTransactionsQuery(userId);
  const createMutation = useCreateTransactionMutation();
  const updateMutation = useUpdateTransactionMutation();
  const deleteMutation = useDeleteTransactionMutation();

  const [period, setPeriod] = useState<Period>('todas');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EditingTransaction | null>(null);

  const rows = useMemo(() => {
    const all = transactionsQuery.data ?? [];
    return all
      .filter((t) => !t.isTransferencia && (t.tipo || '').toLowerCase() === tipo)
      .map((t) => ({ ...t, _date: parseDate(t) }))
      .filter((t) => inPeriod(t._date, period))
      .filter((t) => !category || t.categoria === category)
      .filter((t) => !search || (t.descricao || '').toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b._date.getTime() - a._date.getTime());
  }, [transactionsQuery.data, tipo, period, category, search]);

  const categoryOptions = useMemo(() => {
    const all = transactionsQuery.data ?? [];
    const set = new Set(all.filter((t) => (t.tipo || '').toLowerCase() === tipo).map((t) => t.categoria || 'Outros'));
    return [...set].map((c) => ({ value: c, label: c }));
  }, [transactionsQuery.data, tipo]);

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(t: Transaction) {
    setEditing({ id: t.id, descricao: t.descricao, valor: t.valor, categoria: t.categoria, tipo: t.tipo, accountId: undefined });
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Excluir esta transação? Essa ação não pode ser desfeita.')) return;
    try {
      await deleteMutation.mutateAsync(id);
      addToast('Transação excluída com sucesso!', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao excluir transação', 'error');
    }
  }

  async function handleSubmit(payload: Omit<TransactionPayload, 'userId'>) {
    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          payload: { tipo: payload.tipo, valor: Math.abs(payload.valor), descricao: payload.descricao, categoria: payload.categoria }
        });
        addToast('Transação atualizada com sucesso!', 'success');
      } else {
        await createMutation.mutateAsync({ ...payload, userId: userId as string });
        // Observer Pattern -- mesmo serviço de sempre, notifica alertas de
        // gasto alto/categoria e o log de atividade em localStorage.
        observerService.notify({ ...payload, userId });
        addToast('Transação adicionada com sucesso!', 'success');
      }
      setModalOpen(false);
      setEditing(null);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao salvar transação', 'error');
    }
  }

  const isEmpty = !transactionsQuery.isLoading && !transactionsQuery.isError && rows.length === 0;
  const hasAnyFilter = Boolean(search || category || period !== 'todas');

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        <Button onClick={openNew}>+ Nova {tipo === 'receita' ? 'receita' : 'despesa'}</Button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.tabs} role="tablist" aria-label="Período">
          {(
            [
              ['todas', 'Todas'],
              ['este-mes', 'Este mês'],
              ['mes-passado', 'Mês passado']
            ] as [Period, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={period === value}
              className={[styles.tab, period === value && styles.tabActive].filter(Boolean).join(' ')}
              onClick={() => setPeriod(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={styles.searchField}>
          <Input label="Buscar" placeholder="Buscar por descrição..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className={styles.categoryField}>
          <Select
            label="Categoria"
            placeholder="Todas as categorias"
            options={categoryOptions}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
      </div>

      <QueryState
        isLoading={transactionsQuery.isLoading}
        isError={transactionsQuery.isError}
        isEmpty={isEmpty}
        onRetry={transactionsQuery.refetch}
        skeleton={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height="2.75rem" />
            ))}
          </div>
        }
        emptyTitle={hasAnyFilter ? 'Nada encontrado com esses filtros' : `Nenhuma ${tipo === 'receita' ? 'receita' : 'despesa'} ainda`}
        emptyDescription={hasAnyFilter ? 'Tenta limpar a busca ou trocar o período.' : emptyDescription}
      >
        <Table caption={title}>
          <thead>
            <tr>
              <th scope="col">Data</th>
              <th scope="col">Descrição</th>
              <th scope="col">Categoria</th>
              <th scope="col" style={{ textAlign: 'right' }}>
                Valor
              </th>
              <th scope="col" aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td>{t._date.toLocaleDateString('pt-BR')}</td>
                <td>{t.descricao || 'Sem descrição'}</td>
                <td>
                  <Badge tone="neutral">{t.categoria || 'Outros'}</Badge>
                </td>
                <TableNumericCell>
                  <MoneyFigure value={Math.abs(t.valor || 0)} sign={tipo === 'receita' ? 'positive' : 'negative'} size="sm" />
                </TableNumericCell>
                <td>
                  <div className={styles.actionsCell}>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(t)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(t.id)}>
                      Excluir
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </QueryState>

      <p className={styles.footer}>
        Mostrando {rows.length} de {(transactionsQuery.data ?? []).filter((t) => (t.tipo || '').toLowerCase() === tipo).length}
      </p>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        accounts={accounts}
        cards={cards}
        knownNames={people.map((p: { nome: string }) => p.nome)}
        editingTransaction={editing}
        defaultTipo={tipo === 'receita' ? 'Receita' : 'Despesa'}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
