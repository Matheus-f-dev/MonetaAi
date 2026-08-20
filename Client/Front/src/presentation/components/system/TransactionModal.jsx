import { useState, useEffect } from 'react';
import { ValidationContext, AmountValidation } from '../../../core/services/ValidationStrategy';
import { TransactionFactory } from '../../../core/services/TransactionFactory';
import { useToast } from '../../hooks/useToast';
import { CATEGORIES } from '../../../shared/categories';

const emptyForm = {
  descricao: '',
  valor: '',
  categoria: '',
  tipo: 'Despesa',
  data: new Date().toISOString().split('T')[0],
  cardId: '',
  parcelas: '1',
  accountId: ''
};

export function TransactionModal({ isOpen, onClose, onSubmit, cards = [], accounts = [], knownNames = [], editingTransaction = null }) {
  const { addToast } = useToast();
  const [formData, setFormData] = useState(emptyForm);
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [participants, setParticipants] = useState([{ nome: '', valor: '' }, { nome: '', valor: '' }]);
  const isEditing = Boolean(editingTransaction);

  const categorias = CATEGORIES;

  // Pré-carrega o formulário quando o modal abre em modo de edição
  useEffect(() => {
    if (!isOpen) return;

    if (editingTransaction) {
      setFormData({
        descricao: editingTransaction.descricao || '',
        valor: Math.abs(parseFloat(editingTransaction.valor) || 0).toString(),
        categoria: editingTransaction.categoria || '',
        tipo: editingTransaction.tipo?.toLowerCase() === 'receita' ? 'Receita' : 'Despesa',
        data: new Date().toISOString().split('T')[0],
        cardId: editingTransaction.cardId || '',
        parcelas: '1',
        accountId: editingTransaction.accountId || ''
      });
    } else {
      setFormData(emptyForm);
    }
    setSplitEnabled(false);
    setParticipants([{ nome: '', valor: '' }, { nome: '', valor: '' }]);
  }, [isOpen, editingTransaction]);

  const updateParticipant = (index, field, value) => {
    setParticipants(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const addParticipant = () => setParticipants(prev => [...prev, { nome: '', valor: '' }]);

  const removeParticipant = (index) => setParticipants(prev => prev.filter((_, i) => i !== index));

  const splitEqually = () => {
    const total = parseFloat(formData.valor) || 0;
    const n = participants.length || 1;
    const share = (total / n).toFixed(2);
    setParticipants(prev => prev.map(p => ({ ...p, valor: share })));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Strategy - validar valor primeiro
    const validator = new ValidationContext(new AmountValidation());
    const validation = validator.validate(formData.valor);

    if (!validation.isValid) {
      addToast(validation.message, 'error');
      return;
    }

    // Factory Method Pattern - criar objeto baseado no tipo
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    try {
      const factoryTransaction = TransactionFactory.createTransaction(formData.tipo, {
        valor: formData.valor,
        descricao: formData.descricao,
        categoria: formData.categoria,
        data: formData.data,
        userId: user.uid || 'default-user'
      });


    } catch (error) {
      addToast('Erro ao criar transação: ' + error.message, 'error');
      return;
    }

    const parcelas = parseInt(formData.parcelas, 10) || 1;

    const validParticipants = participants
      .map(p => ({ nome: p.nome.trim(), valor: parseFloat(p.valor) || 0 }))
      .filter(p => p.nome && p.valor > 0);

    if (formData.tipo === 'Despesa' && splitEnabled && validParticipants.length === 0) {
      addToast('Adicione ao menos uma pessoa com nome e valor para dividir a despesa', 'error');
      return;
    }

    const transactionPayload = {
      tipo: formData.tipo,
      valor: formData.tipo === 'Receita' ? Math.abs(parseFloat(formData.valor)) : -Math.abs(parseFloat(formData.valor)),
      descricao: formData.descricao,
      categoria: formData.categoria,
      data: formData.data,
      userId: user.uid || 'default-user',
      ...(formData.accountId ? { accountId: formData.accountId } : {}),
      ...(formData.tipo === 'Despesa' && formData.cardId ? { cardId: formData.cardId } : {}),
      ...(formData.tipo === 'Despesa' && formData.cardId && parcelas > 1 ? { parcelas } : {}),
      ...(formData.tipo === 'Despesa' && splitEnabled && validParticipants.length > 0
        ? { split: { participantes: validParticipants.map(p => ({ ...p, pago: false })) } }
        : {})
    };

    onSubmit(transactionPayload);
    setFormData(emptyForm);
    setSplitEnabled(false);
    setParticipants([{ nome: '', valor: '' }, { nome: '', valor: '' }]);
    onClose();
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{isEditing ? 'Editar Transação' : 'Nova Transação'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Descrição</label>
            <input
              type="text"
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              placeholder="Ex: Almoço no restaurante"
              required
            />
          </div>

          <div className="form-group">
            <label>Valor (R$)</label>
            <input
              type="number"
              name="valor"
              value={formData.valor}
              onChange={handleChange}
              placeholder="0,00"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label>Categoria</label>
            <select
              name="categoria"
              value={formData.categoria}
              onChange={handleChange}
              required
            >
              <option value="">Selecione uma categoria</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Data</label>
            <input
              type="date"
              name="data"
              value={formData.data}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Tipo</label>
            <div className="tipo-buttons">
              <button
                type="button"
                className={`tipo-btn ${formData.tipo === 'Receita' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, tipo: 'Receita'})}
              >
                Receita
              </button>
              <button
                type="button"
                className={`tipo-btn ${formData.tipo === 'Despesa' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, tipo: 'Despesa'})}
              >
                Despesa
              </button>
            </div>
          </div>

          {accounts.length > 0 && !isEditing && (
            <div className="form-group">
              <label>Conta (opcional)</label>
              <select name="accountId" value={formData.accountId} onChange={handleChange}>
                <option value="">Conta principal</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>{account.nome}</option>
                ))}
              </select>
            </div>
          )}

          {formData.tipo === 'Despesa' && cards.length > 0 && !isEditing && (
            <div className="form-group">
              <label>Cartão (opcional)</label>
              <select name="cardId" value={formData.cardId} onChange={handleChange}>
                <option value="">Não usar cartão</option>
                {cards.map(card => (
                  <option key={card.id} value={card.id}>{card.nome} •• {card.final}</option>
                ))}
              </select>
            </div>
          )}

          {formData.tipo === 'Despesa' && formData.cardId && !isEditing && (
            <div className="form-group">
              <label>Parcelas</label>
              <select name="parcelas" value={formData.parcelas} onChange={handleChange}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n === 1 ? 'À vista' : `${n}x de R$ ${(parseFloat(formData.valor || 0) / n).toFixed(2)}`}</option>
                ))}
              </select>
            </div>
          )}

          {formData.tipo === 'Despesa' && !isEditing && (
            <div className="form-group">
              <label className="split-toggle">
                <input
                  type="checkbox"
                  checked={splitEnabled}
                  onChange={(e) => setSplitEnabled(e.target.checked)}
                />
                Dividir com outras pessoas
              </label>

              {splitEnabled && (
                <div className="split-box">
                  <datalist id="known-people">
                    {knownNames.map(name => <option key={name} value={name} />)}
                  </datalist>

                  {participants.map((p, index) => (
                    <div className="split-row" key={index}>
                      <input
                        type="text"
                        list="known-people"
                        placeholder="Nome da pessoa"
                        value={p.nome}
                        onChange={(e) => updateParticipant(index, 'nome', e.target.value)}
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        value={p.valor}
                        onChange={(e) => updateParticipant(index, 'valor', e.target.value)}
                      />
                      <button
                        type="button"
                        className="split-remove"
                        onClick={() => removeParticipant(index)}
                        disabled={participants.length <= 1}
                        aria-label="Remover pessoa"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  <div className="split-actions">
                    <button type="button" className="split-action-link" onClick={addParticipant}>+ Adicionar pessoa</button>
                    <button type="button" className="split-action-link" onClick={splitEqually}>Dividir valor igualmente</button>
                  </div>

                  <p className="split-hint">
                    Cada pessoa listada aqui deve o valor indicado a você por essa despesa — depois é só marcar como pago na aba Pessoas.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="modal-buttons">
            <button type="button" onClick={onClose} className="btn-cancelar">
              Cancelar
            </button>
            <button type="submit" className="btn-adicionar">
              {isEditing ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}