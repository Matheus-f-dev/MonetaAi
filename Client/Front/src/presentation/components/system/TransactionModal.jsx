import { useState } from 'react';
import { ValidationContext, AmountValidation } from '../../../core/services/ValidationStrategy';
import { TransactionFactory } from '../../../core/services/TransactionFactory';
import { useToast } from '../../hooks/useToast';

export function TransactionModal({ isOpen, onClose, onSubmit }) {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    categoria: '',
    tipo: 'Despesa',
    data: new Date().toISOString().split('T')[0]
  });

  const categorias = [
    'Alimentação',
    'Lazer', 
    'Transporte',
    'Saúde',
    'Outros'
  ];

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
    
    const transactionPayload = {
      tipo: formData.tipo,
      valor: formData.tipo === 'Receita' ? Math.abs(parseFloat(formData.valor)) : -Math.abs(parseFloat(formData.valor)),
      descricao: formData.descricao,
      categoria: formData.categoria,
      data: formData.data,
      userId: user.uid || 'default-user'
    };
    
    onSubmit(transactionPayload);
    setFormData({ descricao: '', valor: '', categoria: '', tipo: 'Despesa', data: new Date().toISOString().split('T')[0] });
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
        <h2>Nova Transação</h2>
        
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

          <div className="modal-buttons">
            <button type="button" onClick={onClose} className="btn-cancelar">
              Cancelar
            </button>
            <button type="submit" className="btn-adicionar">
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}