import { useState, type FormEvent } from 'react';
import { Badge, Button, Card, Input, Modal, MoneyFigure, QueryState, Select, Skeleton } from '../../design-system';
import { useToast } from '../../presentation/hooks/useToast';
import type { Account } from './api';
import {
  useAccountResumoQuery,
  useAccountsQuery,
  useCreateAccountMutation,
  useCurrentUserId,
  useDeleteAccountMutation,
  useReconcileMutation,
  useReconciliationHistoryQuery,
  useTransferMutation,
  useUpdateAccountMutation
} from './queries';
import styles from './ContasPage.module.css';

const TIPOS = [
  { value: 'corrente', label: 'Conta corrente' },
  { value: 'poupanca', label: 'Poupança' },
  { value: 'carteira', label: 'Carteira física' },
  { value: 'digital', label: 'Conta digital' },
  { value: 'investimento', label: 'Investimento' },
  { value: 'conjunta', label: 'Conta conjunta' }
];

function tipoLabel(tipo: string): string {
  return TIPOS.find((t) => t.value === tipo)?.label || tipo;
}

const emptyForm = { nome: '', tipo: 'corrente', saldoInicial: '', instituicao: '' };
const emptyTransfer = { fromAccountId: '', toAccountId: '', valor: '', descricao: '' };

/**
 * Fase 4 -- reconstrução de /contas dentro do AppShell. Mesmo contrato de
 * backend da tela antiga (contas com saldo calculado, resumo consolidado,
 * transferência entre contas), mais reconciliação de saldo (nova nesta
 * fase, ver FRONTEND_TODO.md item 7): um botão "Conferir saldo" por conta
 * que compara o que o usuário vê no banco com o saldo calculado aqui.
 */
export default function ContasPage() {
  const userId = useCurrentUserId();
  const { addToast } = useToast();

  const accountsQuery = useAccountsQuery(userId);
  const resumoQuery = useAccountResumoQuery(userId);
  const createMutation = useCreateAccountMutation();
  const updateMutation = useUpdateAccountMutation();
  const deleteMutation = useDeleteAccountMutation();
  const transferMutation = useTransferMutation();

  const accounts = accountsQuery.data ?? [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [transferOpen, setTransferOpen] = useState(false);
  const [transferForm, setTransferForm] = useState(emptyTransfer);

  const [reconcileAccountId, setReconcileAccountId] = useState<string | null>(null);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(account: Account) {
    setEditing(account);
    setForm({
      nome: account.nome,
      tipo: account.tipo,
      saldoInicial: String(account.saldoInicial ?? 0),
      instituicao: account.instituicao || ''
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.nome) {
      addToast('Dê um nome pra conta', 'error');
      return;
    }
    const input = { nome: form.nome, tipo: form.tipo, saldoInicial: parseFloat(form.saldoInicial) || 0, instituicao: form.instituicao };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, input });
        addToast('Conta atualizada com sucesso!', 'success');
      } else {
        await createMutation.mutateAsync(input);
        addToast('Conta cadastrada com sucesso!', 'success');
      }
      setModalOpen(false);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao salvar conta', 'error');
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Remover esta conta? O histórico de transações já vinculado a ela é mantido.')) return;
    try {
      await deleteMutation.mutateAsync(id);
      addToast('Conta removida com sucesso', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao remover conta', 'error');
    }
  }

  async function handleTransferSubmit(e: FormEvent) {
    e.preventDefault();
    if (!transferForm.fromAccountId || !transferForm.toAccountId || !transferForm.valor) {
      addToast('Preencha conta de origem, destino e valor', 'error');
      return;
    }
    if (transferForm.fromAccountId === transferForm.toAccountId) {
      addToast('Escolha duas contas diferentes', 'error');
      return;
    }
    try {
      await transferMutation.mutateAsync({
        fromAccountId: transferForm.fromAccountId,
        toAccountId: transferForm.toAccountId,
        valor: parseFloat(transferForm.valor) || 0,
        descricao: transferForm.descricao
      });
      addToast('Transferência realizada com sucesso!', 'success');
      setTransferOpen(false);
      setTransferForm(emptyTransfer);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro na transferência', 'error');
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const reconcileAccount = accounts.find((a) => a.id === reconcileAccountId) ?? null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Contas</h1>
          <p className={styles.subtitle}>Onde seu dinheiro está — e pra onde ele vai</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary" onClick={() => setTransferOpen(true)} disabled={accounts.length < 2}>
            ⇄ Transferir
          </Button>
          <Button onClick={openNew}>+ Nova conta</Button>
        </div>
      </div>

      <QueryState
        isLoading={resumoQuery.isLoading}
        isError={resumoQuery.isError}
        onRetry={resumoQuery.refetch}
        skeleton={<Skeleton height="5.5rem" />}
      >
        {resumoQuery.data && (
          <div className={styles.resumo}>
            <Card perforated padding="sm">
              <p className={styles.resumoLabel}>Saldo total</p>
              <MoneyFigure value={resumoQuery.data.saldoTotal} sign="auto" size="md" />
            </Card>
            <Card perforated padding="sm">
              <p className={styles.resumoLabel}>Disponível</p>
              <MoneyFigure value={resumoQuery.data.saldoDisponivel} sign="auto" size="md" />
            </Card>
            <Card perforated padding="sm">
              <p className={styles.resumoLabel}>Comprometido</p>
              <MoneyFigure value={resumoQuery.data.saldoComprometido} sign="negative" size="md" />
            </Card>
            <Card perforated padding="sm">
              <p className={styles.resumoLabel}>Previsto</p>
              <MoneyFigure value={resumoQuery.data.saldoPrevisto} sign="auto" size="md" />
            </Card>
            <Card perforated padding="sm">
              <p className={styles.resumoLabel}>Limite de crédito livre</p>
              <MoneyFigure value={resumoQuery.data.limiteCreditoDisponivel} sign="positive" size="md" />
            </Card>
          </div>
        )}
      </QueryState>

      <QueryState
        isLoading={accountsQuery.isLoading}
        isError={accountsQuery.isError}
        isEmpty={!accountsQuery.isLoading && !accountsQuery.isError && accounts.length === 0}
        onRetry={accountsQuery.refetch}
        skeleton={
          <div className={styles.grid}>
            {[0, 1, 2].map((i) => (
              <Card key={i} perforated>
                <Skeleton width="50%" height="0.75rem" />
                <div style={{ marginTop: 12 }}>
                  <Skeleton width="70%" height="1.5rem" />
                </div>
              </Card>
            ))}
          </div>
        }
        emptyTitle="Nenhuma conta ainda"
        emptyDescription="Cadastre suas contas correntes, poupanças e carteiras pra acompanhar o saldo de cada uma."
      >
        <div className={styles.grid}>
          {accounts.map((account) => (
            <Card key={account.id} perforated>
              <div className={styles.cardTop}>
                <Badge tone="neutral">{tipoLabel(account.tipo)}</Badge>
                {account.principal && (
                  <Badge tone="brand" withDot>
                    principal
                  </Badge>
                )}
              </div>
              <div className={styles.cardNome}>{account.nome}</div>
              {account.instituicao && <div className={styles.cardInst}>{account.instituicao}</div>}
              <div className={styles.cardSaldo}>
                <MoneyFigure value={account.saldoAtual} sign="auto" size="lg" />
              </div>
              <div className={styles.cardActions}>
                <Button size="sm" variant="ghost" onClick={() => openEdit(account)}>
                  Editar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setReconcileAccountId(account.id)}>
                  Conferir saldo
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(account.id)}>
                  Remover
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </QueryState>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar conta' : 'Nova conta'}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input label="Nome" placeholder="Ex: Conta corrente Itaú" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
          <Select label="Tipo" options={TIPOS} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} />
          <Input
            label="Instituição (opcional)"
            placeholder="Ex: Itaú, Nubank..."
            value={form.instituicao}
            onChange={(e) => setForm({ ...form, instituicao: e.target.value })}
          />
          <Input
            label="Saldo inicial (R$)"
            type="number"
            step="0.01"
            placeholder="0,00"
            value={form.saldoInicial}
            onChange={(e) => setForm({ ...form, saldoInicial: e.target.value })}
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

      <Modal open={transferOpen} onClose={() => setTransferOpen(false)} title="Transferir entre contas">
        <form onSubmit={handleTransferSubmit} className={styles.form}>
          <Select
            label="De"
            placeholder="Selecione a conta de origem"
            options={accounts.map((a) => ({ value: a.id, label: `${a.nome} (${a.saldoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})` }))}
            value={transferForm.fromAccountId}
            onChange={(e) => setTransferForm({ ...transferForm, fromAccountId: e.target.value })}
            required
          />
          <Select
            label="Para"
            placeholder="Selecione a conta de destino"
            options={accounts.map((a) => ({ value: a.id, label: a.nome }))}
            value={transferForm.toAccountId}
            onChange={(e) => setTransferForm({ ...transferForm, toAccountId: e.target.value })}
            required
          />
          <Input
            label="Valor (R$)"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0,00"
            value={transferForm.valor}
            onChange={(e) => setTransferForm({ ...transferForm, valor: e.target.value })}
            required
          />
          <Input
            label="Descrição (opcional)"
            placeholder="Ex: reserva de emergência"
            value={transferForm.descricao}
            onChange={(e) => setTransferForm({ ...transferForm, descricao: e.target.value })}
          />
          <div className={styles.formActions}>
            <Button type="button" variant="secondary" onClick={() => setTransferOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={transferMutation.isPending}>
              {transferMutation.isPending ? 'Transferindo...' : 'Transferir'}
            </Button>
          </div>
        </form>
      </Modal>

      {reconcileAccount && (
        <ReconcileModal account={reconcileAccount} onClose={() => setReconcileAccountId(null)} />
      )}
    </div>
  );
}

interface ReconcileModalProps {
  account: Account;
  onClose: () => void;
}

// Botão "Conferir saldo" (FRONTEND_TODO.md item 7, novo nesta fase): o
// usuário informa o saldo que vê no extrato do banco, a API devolve a
// diferença pro saldo calculado aqui, e fica registrado no histórico —
// útil pra ver se a divergência é recorrente (ex.: um lançamento que o
// bot nunca capturou).
function ReconcileModal({ account, onClose }: ReconcileModalProps) {
  const { addToast } = useToast();
  const [saldoInformado, setSaldoInformado] = useState('');
  const reconcileMutation = useReconcileMutation();
  const historyQuery = useReconciliationHistoryQuery(account.id);
  const [lastResult, setLastResult] = useState<{ diferenca: number; bate: boolean } | null>(null);

  const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!saldoInformado) {
      addToast('Informe o saldo que você vê no banco', 'error');
      return;
    }
    try {
      const result = await reconcileMutation.mutateAsync({ accountId: account.id, saldoInformado: parseFloat(saldoInformado) || 0 });
      setLastResult({ diferenca: result.diferenca, bate: Boolean(result.bate) });
      addToast(result.bate ? 'Saldo confere certinho!' : `Diferença de ${brl(result.diferenca)} encontrada`, result.bate ? 'success' : 'error');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao conferir saldo', 'error');
    }
  }

  return (
    <Modal open onClose={onClose} title={`Conferir saldo — ${account.nome}`}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <p className={styles.reconcileHint}>
          Saldo calculado aqui: <strong>{brl(account.saldoAtual)}</strong>. Informe o que você vê no extrato do banco pra comparar.
        </p>
        <Input
          label="Saldo no banco (R$)"
          type="number"
          step="0.01"
          placeholder="0,00"
          value={saldoInformado}
          onChange={(e) => setSaldoInformado(e.target.value)}
          required
        />
        {lastResult && (
          <div className={lastResult.bate ? styles.reconcileOk : styles.reconcileDiff}>
            {lastResult.bate ? 'Confere certinho — diferença de R$ 0,00.' : `Diferença de ${brl(lastResult.diferenca)}.`}
          </div>
        )}

        {!historyQuery.isLoading && (historyQuery.data?.length ?? 0) > 0 && (
          <div className={styles.reconcileHistory}>
            <p className={styles.reconcileHistoryTitle}>Histórico</p>
            {historyQuery.data!.slice(0, 5).map((r) => (
              <div key={r.id} className={styles.reconcileHistoryRow}>
                <span>{r.criadoEm ? new Date(r.criadoEm).toLocaleDateString('pt-BR') : '—'}</span>
                <span>{brl(r.diferenca)}</span>
              </div>
            ))}
          </div>
        )}

        <div className={styles.formActions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Fechar
          </Button>
          <Button type="submit" disabled={reconcileMutation.isPending}>
            {reconcileMutation.isPending ? 'Conferindo...' : 'Conferir'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
