import { useState } from 'react';
import { useTransactionData } from '../../hooks/useTransactionData';
import { useToast } from '../../hooks/useToast';
import { TransactionModal } from './TransactionModal';

export function ActivityHistory() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.uid || 'default-user';
  const { transactions: rawTransactions, loading, fetchTransactions, updateTransaction, deleteTransaction } = useTransactionData(userId);
  const { addToast } = useToast();
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    period: 'all'
  });
  const [editingTransaction, setEditingTransaction] = useState(null);

  const transactions = rawTransactions
    .map(transaction => {
      const dateField = transaction.dataHora || transaction.data || transaction.criadoEm;
      let processedDate = dateField;

      if (dateField && typeof dateField === 'string' && dateField.includes('/')) {
        const [datePart] = dateField.split(', ');
        const [day, month, year] = datePart.split('/');
        processedDate = new Date(year, month - 1, day);
      }

      return {
        id: transaction.id || Math.random(),
        date: processedDate,
        description: transaction.descricao || 'Sem descrição',
        category: transaction.categoria || 'Outros',
        value: transaction.valor || 0,
        type: (transaction.tipo || 'despesa').toLowerCase(),
        raw: transaction
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const processedTransactions = transactions;

  const handleFilterChange = async (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    
    const backendFilters = {};
    
    if (newFilters.type !== 'all') {
      backendFilters.type = newFilters.type;
    }
    
    if (newFilters.category !== 'all') {
      backendFilters.category = newFilters.category;
    }
    
    if (newFilters.period !== 'all') {
      const now = new Date();
      switch (newFilters.period) {
        case 'thisMonth':
          backendFilters.startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          backendFilters.endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
          break;
        case 'lastMonth':
          backendFilters.startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
          backendFilters.endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
          break;
        case 'last3Months':
          backendFilters.startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split('T')[0];
          break;
      }
    }
    
    await fetchTransactions(backendFilters);
  };

  // Obter categorias únicas para o filtro
  const uniqueCategories = [...new Set(transactions.map(t => t.category))];

  const handleDelete = async (transactionId) => {
    if (!window.confirm('Excluir esta transação? Essa ação não pode ser desfeita.')) return;

    const result = await deleteTransaction(transactionId);
    addToast(result.message || (result.success ? 'Transação excluída com sucesso!' : 'Erro ao excluir transação'), result.success ? 'success' : 'error');
  };

  const handleUpdateSubmit = async (transactionData) => {
    const result = await updateTransaction(editingTransaction.id, {
      tipo: transactionData.tipo,
      valor: Math.abs(transactionData.valor),
      descricao: transactionData.descricao,
      categoria: transactionData.categoria
    });

    addToast(result.message || (result.success ? 'Transação atualizada com sucesso!' : 'Erro ao atualizar transação'), result.success ? 'success' : 'error');
    setEditingTransaction(null);
  };

  if (loading) {
    return <div className="activity-loading">Carregando histórico...</div>;
  }

  return (
    <div className="activity-history">
      <div className="activity-header">
        <h2>Histórico de Atividades</h2>
        <p>Todas as suas transações (receitas e despesas)</p>
      </div>

      <div className="activity-filters">
        <select 
          value={filters.type} 
          onChange={(e) => handleFilterChange('type', e.target.value)}
          className="filter-select"
        >
          <option value="all">Todos os tipos</option>
          <option value="receita">Receitas</option>
          <option value="despesa">Despesas</option>
        </select>

        <select 
          value={filters.category} 
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="filter-select"
        >
          <option value="all">Todas as categorias</option>
          {uniqueCategories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>

        <select 
          value={filters.period} 
          onChange={(e) => handleFilterChange('period', e.target.value)}
          className="filter-select"
        >
          <option value="all">Todos os períodos</option>
          <option value="thisMonth">Este mês</option>
          <option value="lastMonth">Mês passado</option>
          <option value="last3Months">Últimos 3 meses</option>
        </select>
      </div>

      <div className="activity-list">
        {processedTransactions.length > 0 ? (
          processedTransactions.map(transaction => (
            <div key={transaction.id} className={`activity-item ${transaction.type}`}>
              <div className="activity-info">
                <div className="activity-description">{transaction.description}</div>
                <div className="activity-meta">
                  <span className="activity-category">{transaction.category}</span>
                  <span className="activity-date">
                    {(() => {
                      try {
                        const date = new Date(transaction.date);
                        return isNaN(date.getTime()) ? 'Data inválida' : date.toLocaleDateString('pt-BR');
                      } catch {
                        return 'Data inválida';
                      }
                    })()}
                  </span>
                </div>
              </div>
              <div className="activity-right">
                <div className={`activity-value ${transaction.type}`}>
                  {transaction.type === 'receita' ?
                    `+R$ ${Math.abs(transaction.value).toFixed(2)}` :
                    `-R$ ${Math.abs(transaction.value).toFixed(2)}`
                  }
                </div>
                <div className="activity-actions">
                  <button
                    type="button"
                    className="activity-action-btn"
                    onClick={() => setEditingTransaction(transaction.raw)}
                    aria-label="Editar transação"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="activity-action-btn danger"
                    onClick={() => handleDelete(transaction.raw.id)}
                    aria-label="Excluir transação"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-activities">
            Nenhuma atividade encontrada.
          </div>
        )}
      </div>

      <TransactionModal
        isOpen={Boolean(editingTransaction)}
        onClose={() => setEditingTransaction(null)}
        onSubmit={handleUpdateSubmit}
        editingTransaction={editingTransaction}
      />
    </div>
  );
}