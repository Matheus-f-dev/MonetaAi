import { useState } from 'react';

export function TransactionModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    categoria: '',
    tipo: 'Despesa'
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
    onSubmit(formData);
    setFormData({ descricao: '', valor: '', categoria: '', tipo: 'Despesa' });
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