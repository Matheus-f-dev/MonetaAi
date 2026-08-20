import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useCards } from '../hooks/useCards';
import { useToast } from '../hooks/useToast';
import { Sidebar } from '../components/system';
import '../styles/pages/Cards.css';

const CORES = [
  { id: 'roxo', label: 'Roxo' },
  { id: 'azul', label: 'Azul' },
  { id: 'verde', label: 'Verde' },
  { id: 'grafite', label: 'Grafite' }
];

const emptyForm = { nome: '', instituicao: '', final: '', limite: '', diaFechamento: '1', diaVencimento: '10', cor: 'roxo' };

export default function Cards() {
  useTheme();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.uid || null;

  const { loading, cards, invoices, createCard, updateCard, deleteCard } = useCards(userId);
  const { addToast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const brl = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const openNewCardForm = () => {
    setEditingCard(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEditForm = (card) => {
    setEditingCard(card);
    setForm({
      nome: card.nome || '',
      instituicao: card.instituicao || '',
      final: card.final || '',
      limite: card.limite?.toString() || '',
      diaFechamento: card.diaFechamento?.toString() || '1',
      diaVencimento: card.diaVencimento?.toString() || '10',
      cor: card.cor || 'roxo'
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
    if (!form.nome || !form.final) {
      addToast('Preencha ao menos o nome e os 4 últimos dígitos do cartão', 'error');
      return;
    }

    const result = editingCard
      ? await updateCard(editingCard.id, form)
      : await createCard(form);

    addToast(
      result.message || (result.success ? 'Cartão salvo com sucesso!' : 'Erro ao salvar cartão'),
      result.success ? 'success' : 'error'
    );

    if (result.success) {
      setIsFormOpen(false);
      setForm(emptyForm);
      setEditingCard(null);
    }
  };

  const handleDelete = async (cardId) => {
    if (!window.confirm('Remover este cartão? O histórico de compras vinculado a ele é mantido.')) return;
    const result = await deleteCard(cardId);
    addToast(result.message || (result.success ? 'Cartão removido' : 'Erro ao remover cartão'), result.success ? 'success' : 'error');
  };

  return (
    <div className="sys-layout">
      <Sidebar />

      <main className="cards-main">
        <div className="cards-container">
          <div className="cards-page-header">
            <div>
              <h1 className="cards-title">Cartões</h1>
              <p className="cards-subtitle">Fatura atual e limite usado por cartão</p>
            </div>
            <button className="cards-add-btn" onClick={openNewCardForm}>+ Novo cartão</button>
          </div>

          {loading && cards.length === 0 ? (
            <div className="cards-empty">Carregando cartões...</div>
          ) : cards.length === 0 ? (
            <div className="cards-empty">
              <p>Você ainda não cadastrou nenhum cartão.</p>
              <button className="cards-add-btn" onClick={openNewCardForm}>+ Cadastrar meu primeiro cartão</button>
            </div>
          ) : (
            <div className="cards-grid">
              {cards.map(card => {
                const invoice = invoices[card.id];
                const pct = invoice?.usoPercentual ?? 0;
                return (
                  <div key={card.id} className={`credit-card credit-card--${card.cor || 'roxo'}`}>
                    <div className="credit-card-top">
                      <span className="credit-card-inst">{card.instituicao || card.nome}</span>
                      <span className="credit-card-final">•• {card.final}</span>
                    </div>
                    <div className="credit-card-name">{card.nome}</div>
                    <div className="credit-card-invoice">
                      Fatura atual: <b>{brl(invoice?.total ?? 0)}</b>
                    </div>
                    <div className="credit-card-bottom">
                      <span>fecha dia {card.diaFechamento} · vence dia {card.diaVencimento}</span>
                      <span>{card.limite ? `${pct}% do limite` : 'sem limite definido'}</span>
                    </div>
                    {card.limite > 0 && (
                      <div className="credit-card-bar"><i style={{ width: `${pct}%` }} /></div>
                    )}
                    <div className="credit-card-actions">
                      <button onClick={() => openEditForm(card)}>Editar</button>
                      <button onClick={() => handleDelete(card.id)}>Remover</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {isFormOpen && (
        <div className="cx-modal-overlay" onClick={() => setIsFormOpen(false)}>
          <div className="cx-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingCard ? 'Editar cartão' : 'Novo cartão'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="cx-form-group">
                <label>Apelido do cartão</label>
                <input type="text" name="nome" value={form.nome} onChange={handleChange} placeholder="Ex: Nubank Roxinho" required />
              </div>
              <div className="cx-form-group">
                <label>Instituição</label>
                <input type="text" name="instituicao" value={form.instituicao} onChange={handleChange} placeholder="Ex: Nubank" />
              </div>
              <div className="cx-form-group">
                <label>4 últimos dígitos</label>
                <input type="text" name="final" value={form.final} onChange={handleChange} maxLength={4} placeholder="0000" required />
              </div>
              <div className="cx-form-group">
                <label>Limite (R$)</label>
                <input type="number" name="limite" value={form.limite} onChange={handleChange} step="0.01" min="0" placeholder="0,00" />
              </div>
              <div className="cx-form-row">
                <div className="cx-form-group">
                  <label>Dia de fechamento</label>
                  <input type="number" name="diaFechamento" value={form.diaFechamento} onChange={handleChange} min="1" max="28" />
                </div>
                <div className="cx-form-group">
                  <label>Dia de vencimento</label>
                  <input type="number" name="diaVencimento" value={form.diaVencimento} onChange={handleChange} min="1" max="28" />
                </div>
              </div>
              <div className="cx-form-group">
                <label>Cor</label>
                <div className="cx-color-swatches">
                  {CORES.map(c => (
                    <button
                      type="button"
                      key={c.id}
                      className={`cx-swatch cx-swatch--${c.id} ${form.cor === c.id ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, cor: c.id })}
                      aria-label={c.label}
                    />
                  ))}
                </div>
              </div>
              <div className="cx-modal-buttons">
                <button type="button" onClick={() => setIsFormOpen(false)} className="cx-btn-cancel">Cancelar</button>
                <button type="submit" className="cx-btn-submit" disabled={loading}>
                  {loading ? 'Salvando...' : (editingCard ? 'Salvar' : 'Adicionar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
