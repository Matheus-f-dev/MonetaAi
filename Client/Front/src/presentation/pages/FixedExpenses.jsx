import { useState, useMemo } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useFixedExpenses } from '../hooks/useFixedExpenses';
import { useToast } from '../hooks/useToast';
import { Sidebar } from '../components/system';
import { CATEGORIES } from '../../shared/categories';
import '../styles/pages/FixedExpenses.css';

const ICONES = ['🏠', '💡', '📶', '💧', '🎬', '💪', '📱', '🚗', '🎓', '🛡️', '📌'];

const emptyForm = { nome: '', valor: '', categoria: '', diaVencimento: '5', icone: '🏠' };

const STATUS_LABEL = { paid: 'Pago', due: 'A vencer', late: 'Atrasado' };

export default function FixedExpenses() {
  useTheme();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.uid || null;

  const { loading, fixedExpenses, createFixedExpense, updateFixedExpense, deleteFixedExpense, lancarFixedExpense } = useFixedExpenses(userId);
  const { addToast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const brl = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const summary = useMemo(() => {
    const previsto = fixedExpenses.reduce((sum, f) => sum + (f.valor || 0), 0);
    const pago = fixedExpenses.filter(f => f.status === 'paid').reduce((sum, f) => sum + (f.valor || 0), 0);
    return { previsto, pago };
  }, [fixedExpenses]);

  const openNewForm = () => {
    setEditing(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEditForm = (item) => {
    setEditing(item);
    setForm({
      nome: item.nome || '',
      valor: item.valor?.toString() || '',
      categoria: item.categoria || '',
      diaVencimento: item.diaVencimento?.toString() || '5',
      icone: item.icone || '🏠'
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
    if (!form.nome || !form.valor || !form.diaVencimento) {
      addToast('Preencha nome, valor e dia de vencimento', 'error');
      return;
    }

    const result = editing
      ? await updateFixedExpense(editing.id, form)
      : await createFixedExpense(form);

    addToast(
      result.message || (result.success ? 'Gasto fixo salvo com sucesso!' : 'Erro ao salvar gasto fixo'),
      result.success ? 'success' : 'error'
    );

    if (result.success) {
      setIsFormOpen(false);
      setForm(emptyForm);
      setEditing(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remover este gasto fixo? Os lançamentos já feitos não são apagados.')) return;
    const result = await deleteFixedExpense(id);
    addToast(result.message || (result.success ? 'Gasto fixo removido' : 'Erro ao remover'), result.success ? 'success' : 'error');
  };

  const handleLancar = async (id) => {
    const result = await lancarFixedExpense(id);
    addToast(result.message || (result.success ? 'Lançado como transação do mês!' : 'Erro ao lançar'), result.success ? 'success' : 'error');
  };

  return (
    <div className="sys-layout">
      <Sidebar />

      <main className="fixed-main">
        <div className="fixed-container">
          <div className="fixed-page-header">
            <div>
              <h1 className="fixed-title">Gastos Fixos</h1>
              <p className="fixed-subtitle">
                {brl(summary.previsto)} previstos este mês · {brl(summary.pago)} já pagos
              </p>
            </div>
            <button className="fixed-add-btn" onClick={openNewForm}>+ Novo gasto fixo</button>
          </div>

          {loading && fixedExpenses.length === 0 ? (
            <div className="fixed-empty">Carregando gastos fixos...</div>
          ) : fixedExpenses.length === 0 ? (
            <div className="fixed-empty">
              <p>Nenhum gasto fixo cadastrado ainda. Aluguel, streaming, academia — cadastre uma vez e não precise redigitar todo mês.</p>
              <button className="fixed-add-btn" onClick={openNewForm}>+ Cadastrar primeiro gasto fixo</button>
            </div>
          ) : (
            <div className="fixed-list">
              {fixedExpenses
                .slice()
                .sort((a, b) => a.diaVencimento - b.diaVencimento)
                .map(item => (
                  <div key={item.id} className="fixed-item">
                    <div className="fixed-item-icon">{item.icone || '📌'}</div>
                    <div className="fixed-item-info">
                      <div className="fixed-item-name">{item.nome}</div>
                      <div className="fixed-item-meta">{item.categoria} · vence dia {item.diaVencimento}</div>
                    </div>
                    <div className="fixed-item-amount">{brl(item.valor)}</div>
                    <span className={`fixed-status fixed-status--${item.status}`}>{STATUS_LABEL[item.status] || item.status}</span>
                    <div className="fixed-item-actions">
                      {item.status !== 'paid' && (
                        <button className="fixed-action-btn primary" onClick={() => handleLancar(item.id)}>
                          Lançar agora
                        </button>
                      )}
                      <button className="fixed-action-btn" onClick={() => openEditForm(item)}>Editar</button>
                      <button className="fixed-action-btn danger" onClick={() => handleDelete(item.id)}>Excluir</button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </main>

      {isFormOpen && (
        <div className="fx-modal-overlay" onClick={() => setIsFormOpen(false)}>
          <div className="fx-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Editar gasto fixo' : 'Novo gasto fixo'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="fx-form-group">
                <label>Nome</label>
                <input type="text" name="nome" value={form.nome} onChange={handleChange} placeholder="Ex: Aluguel" required />
              </div>
              <div className="fx-form-group">
                <label>Valor (R$)</label>
                <input type="number" name="valor" value={form.valor} onChange={handleChange} step="0.01" min="0" placeholder="0,00" required />
              </div>
              <div className="fx-form-group">
                <label>Categoria</label>
                <select name="categoria" value={form.categoria} onChange={handleChange}>
                  <option value="">Selecione uma categoria</option>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="fx-form-group">
                <label>Dia de vencimento</label>
                <input type="number" name="diaVencimento" value={form.diaVencimento} onChange={handleChange} min="1" max="28" required />
              </div>
              <div className="fx-form-group">
                <label>Ícone</label>
                <div className="fx-icon-picker">
                  {ICONES.map(ic => (
                    <button
                      type="button"
                      key={ic}
                      className={`fx-icon-option ${form.icone === ic ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, icone: ic })}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div className="fx-modal-buttons">
                <button type="button" onClick={() => setIsFormOpen(false)} className="fx-btn-cancel">Cancelar</button>
                <button type="submit" className="fx-btn-submit" disabled={loading}>
                  {loading ? 'Salvando...' : (editing ? 'Salvar' : 'Adicionar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
