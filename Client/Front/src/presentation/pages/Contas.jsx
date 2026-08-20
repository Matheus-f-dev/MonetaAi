import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useAccounts } from '../hooks/useAccounts';
import { useToast } from '../hooks/useToast';
import { Sidebar } from '../components/system';
import '../styles/pages/Contas.css';

const TIPOS = [
  { id: 'corrente', label: 'Conta corrente' },
  { id: 'poupanca', label: 'Poupança' },
  { id: 'carteira', label: 'Carteira física' },
  { id: 'digital', label: 'Conta digital' },
  { id: 'investimento', label: 'Investimento' },
  { id: 'conjunta', label: 'Conta conjunta' }
];

const emptyForm = { nome: '', tipo: 'corrente', saldoInicial: '', instituicao: '', cor: 'roxo' };
const emptyTransfer = { fromAccountId: '', toAccountId: '', valor: '', descricao: '' };

export default function Contas() {
  useTheme();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.uid || null;

  const { loading, accounts, resumo, createAccount, updateAccount, deleteAccount, transfer } = useAccounts(userId);
  const { addToast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferForm, setTransferForm] = useState(emptyTransfer);

  const brl = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const tipoLabel = (tipo) => TIPOS.find(t => t.id === tipo)?.label || tipo;

  const openNewForm = () => {
    setEditingAccount(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEditForm = (account) => {
    setEditingAccount(account);
    setForm({
      nome: account.nome || '',
      tipo: account.tipo || 'corrente',
      saldoInicial: account.saldoInicial?.toString() || '0',
      instituicao: account.instituicao || '',
      cor: account.cor || 'roxo'
    });
    setIsFormOpen(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      addToast('Usuário não encontrado. Faça login novamente.', 'error');
      return;
    }
    if (!form.nome) {
      addToast('Dê um nome pra conta', 'error');
      return;
    }

    const result = editingAccount
      ? await updateAccount(editingAccount.id, form)
      : await createAccount(form);

    addToast(
      result.message || (result.success ? 'Conta salva com sucesso!' : 'Erro ao salvar conta'),
      result.success ? 'success' : 'error'
    );

    if (result.success) {
      setIsFormOpen(false);
      setForm(emptyForm);
      setEditingAccount(null);
    }
  };

  const handleDelete = async (accountId) => {
    if (!window.confirm('Remover esta conta? O histórico de transações já vinculado a ela é mantido.')) return;
    const result = await deleteAccount(accountId);
    addToast(result.message || (result.success ? 'Conta removida' : 'Erro ao remover conta'), result.success ? 'success' : 'error');
  };

  const handleTransferChange = (e) => setTransferForm({ ...transferForm, [e.target.name]: e.target.value });

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferForm.fromAccountId || !transferForm.toAccountId || !transferForm.valor) {
      addToast('Preencha conta de origem, destino e valor', 'error');
      return;
    }
    if (transferForm.fromAccountId === transferForm.toAccountId) {
      addToast('Escolha duas contas diferentes', 'error');
      return;
    }

    const result = await transfer(transferForm);
    addToast(result.message || (result.success ? 'Transferência realizada!' : 'Erro na transferência'), result.success ? 'success' : 'error');

    if (result.success) {
      setIsTransferOpen(false);
      setTransferForm(emptyTransfer);
    }
  };

  return (
    <div className="sys-layout">
      <Sidebar />

      <main className="ac-main">
        <div className="ac-container">
          <div className="ac-page-header">
            <div>
              <h1 className="ac-title">Contas</h1>
              <p className="ac-subtitle">Onde seu dinheiro está — e pra onde ele vai</p>
            </div>
            <div className="ac-header-actions">
              <button className="ac-btn-secondary" onClick={() => setIsTransferOpen(true)} disabled={accounts.length < 2}>
                ⇄ Transferir
              </button>
              <button className="ac-btn-primary" onClick={openNewForm}>+ Nova conta</button>
            </div>
          </div>

          {resumo && (
            <div className="ac-resumo">
              <div className="ac-resumo-item">
                <span className="ac-resumo-label">Saldo total</span>
                <span className="ac-resumo-value">{brl(resumo.saldoTotal)}</span>
              </div>
              <div className="ac-resumo-item">
                <span className="ac-resumo-label">Disponível</span>
                <span className="ac-resumo-value">{brl(resumo.saldoDisponivel)}</span>
              </div>
              <div className="ac-resumo-item">
                <span className="ac-resumo-label">Comprometido</span>
                <span className="ac-resumo-value warn">{brl(resumo.saldoComprometido)}</span>
              </div>
              <div className="ac-resumo-item">
                <span className="ac-resumo-label">Previsto</span>
                <span className="ac-resumo-value">{brl(resumo.saldoPrevisto)}</span>
              </div>
              <div className="ac-resumo-item">
                <span className="ac-resumo-label">Limite de crédito livre</span>
                <span className="ac-resumo-value good">{brl(resumo.limiteCreditoDisponivel)}</span>
              </div>
            </div>
          )}

          {loading && accounts.length === 0 ? (
            <div className="ac-empty">Carregando contas...</div>
          ) : (
            <div className="ac-grid">
              {accounts.map(account => (
                <div key={account.id} className="ac-card">
                  <div className="ac-card-top">
                    <span className={`ac-tipo-badge ac-tipo--${account.tipo}`}>{tipoLabel(account.tipo)}</span>
                    {account.principal && <span className="ac-principal-badge">principal</span>}
                  </div>
                  <div className="ac-card-nome">{account.nome}</div>
                  {account.instituicao && <div className="ac-card-inst">{account.instituicao}</div>}
                  <div className={`ac-card-saldo ${account.saldoAtual < 0 ? 'negativo' : ''}`}>{brl(account.saldoAtual)}</div>
                  <div className="ac-card-actions">
                    <button onClick={() => openEditForm(account)}>Editar</button>
                    <button onClick={() => handleDelete(account.id)}>Remover</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {isFormOpen && (
        <div className="ac-modal-overlay" onClick={() => setIsFormOpen(false)}>
          <div className="ac-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingAccount ? 'Editar conta' : 'Nova conta'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="ac-form-group">
                <label>Nome</label>
                <input type="text" name="nome" value={form.nome} onChange={handleChange} placeholder="Ex: Conta corrente Itaú" required />
              </div>
              <div className="ac-form-group">
                <label>Tipo</label>
                <select name="tipo" value={form.tipo} onChange={handleChange}>
                  {TIPOS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div className="ac-form-group">
                <label>Instituição (opcional)</label>
                <input type="text" name="instituicao" value={form.instituicao} onChange={handleChange} placeholder="Ex: Itaú, Nubank..." />
              </div>
              <div className="ac-form-group">
                <label>Saldo inicial (R$)</label>
                <input type="number" name="saldoInicial" value={form.saldoInicial} onChange={handleChange} step="0.01" placeholder="0,00" />
              </div>
              <div className="ac-modal-buttons">
                <button type="button" onClick={() => setIsFormOpen(false)} className="ac-btn-cancel">Cancelar</button>
                <button type="submit" className="ac-btn-submit" disabled={loading}>
                  {loading ? 'Salvando...' : (editingAccount ? 'Salvar' : 'Adicionar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isTransferOpen && (
        <div className="ac-modal-overlay" onClick={() => setIsTransferOpen(false)}>
          <div className="ac-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Transferir entre contas</h2>
            <form onSubmit={handleTransferSubmit}>
              <div className="ac-form-group">
                <label>De</label>
                <select name="fromAccountId" value={transferForm.fromAccountId} onChange={handleTransferChange} required>
                  <option value="">Selecione a conta de origem</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.nome} ({brl(a.saldoAtual)})</option>)}
                </select>
              </div>
              <div className="ac-form-group">
                <label>Para</label>
                <select name="toAccountId" value={transferForm.toAccountId} onChange={handleTransferChange} required>
                  <option value="">Selecione a conta de destino</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
              </div>
              <div className="ac-form-group">
                <label>Valor (R$)</label>
                <input type="number" name="valor" value={transferForm.valor} onChange={handleTransferChange} step="0.01" min="0.01" placeholder="0,00" required />
              </div>
              <div className="ac-form-group">
                <label>Descrição (opcional)</label>
                <input type="text" name="descricao" value={transferForm.descricao} onChange={handleTransferChange} placeholder="Ex: reserva de emergência" />
              </div>
              <div className="ac-modal-buttons">
                <button type="button" onClick={() => setIsTransferOpen(false)} className="ac-btn-cancel">Cancelar</button>
                <button type="submit" className="ac-btn-submit" disabled={loading}>
                  {loading ? 'Transferindo...' : 'Transferir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
