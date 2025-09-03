import { useState } from 'react';
import { useTransactions } from '../../hooks/useTransactions';

export function ActivityHistory() {
  const { transactions: rawTransactions, loading } = useTransactions();
  const [filters, setFilters] = useState({
    type: 'all', // all, receita, despesa
    category: 'all',
    period: 'all' // all, thisMonth, lastMonth, last3Months
  });

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
        type: (transaction.tipo || 'despesa').toLowerCase()
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Aplicar filtros
  const processedTransactions = transactions.filter(transaction => {
    // Filtro por tipo
    if (filters.type !== 'all' && transaction.type !== filters.type) {
      return false;
    }
    
    // Filtro por categoria
    if (filters.category !== 'all' && transaction.category !== filters.category) {
      return false;
    }
    
    // Filtro por período
    if (filters.period !== 'all') {
      const transactionDate = new Date(transaction.date);
      const now = new Date();
      
      switch (filters.period) {
        case 'thisMonth':
          if (transactionDate.getMonth() !== now.getMonth() || 
              transactionDate.getFullYear() !== now.getFullYear()) {
            return false;
          }
          break;
        case 'lastMonth':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
          if (transactionDate.getMonth() !== lastMonth.getMonth() || 
              transactionDate.getFullYear() !== lastMonth.getFullYear()) {
            return false;
          }
          break;
        case 'last3Months':
          const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3);
          if (transactionDate < threeMonthsAgo) {
            return false;
          }
          break;
      }
    }
    
    return true;
  });

  // Obter categorias únicas para o filtro
  const uniqueCategories = [...new Set(transactions.map(t => t.category))];


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
          onChange={(e) => setFilters({...filters, type: e.target.value})}
          className="filter-select"
        >
          <option value="all">Todos os tipos</option>
          <option value="receita">Receitas</option>
          <option value="despesa">Despesas</option>
        </select>

        <select 
          value={filters.category} 
          onChange={(e) => setFilters({...filters, category: e.target.value})}
          className="filter-select"
        >
          <option value="all">Todas as categorias</option>
          {uniqueCategories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>

        <select 
          value={filters.period} 
          onChange={(e) => setFilters({...filters, period: e.target.value})}
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
              <div className={`activity-value ${transaction.type}`}>
                {transaction.type === 'receita' ? 
                  `+R$ ${Math.abs(transaction.value).toFixed(2)}` : 
                  `-R$ ${Math.abs(transaction.value).toFixed(2)}`
                }
              </div>
            </div>
          ))
        ) : (
          <div className="no-activities">
            Nenhuma atividade encontrada.
          </div>
        )}
      </div>
    </div>
  );
}