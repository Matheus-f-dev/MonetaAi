import { useState, useMemo } from 'react';
import "../styles/pages/Incomes.css";
import { Sidebar } from '../components/system';
import { useTheme } from '../hooks/useTheme';
import { useTransactionData } from '../hooks/useTransactionData';

export default function Incomes() {
  useTheme();
  const [activeTab, setActiveTab] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.uid || 'default-user';
  const { transactions, fetchTransactions } = useTransactionData(userId);

  const incomes = useMemo(() => {
    return transactions
      .filter(transaction => transaction.tipo && transaction.tipo.toLowerCase() === 'receita')
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
          value: Math.abs(transaction.valor || 0)
        };
      });
  }, [transactions]);

  const filteredIncomes = incomes;

  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    const filters = { type: 'receita' };
    
    if (tab === 'este-mes') {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      filters.startDate = startDate;
      filters.endDate = endDate;
    } else if (tab === 'mes-passado') {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      filters.startDate = startDate;
      filters.endDate = endDate;
    }
    
    if (categoryFilter) filters.category = categoryFilter;
    await fetchTransactions(filters);
  };

  const handleCategoryChange = async (category) => {
    setCategoryFilter(category);
    const filters = { type: 'receita' };
    if (category) filters.category = category;
    await fetchTransactions(filters);
  };

  const categories = useMemo(() => [...new Set(incomes.map(income => income.category))], [incomes]);

  return (
    <div className="sys-layout">
      <Sidebar />
      
      <main className="sys-main">
        
        <div className="incomes-container">
          <div className="incomes-header">
            <h1>Gerenciar Receitas</h1>
          </div>

          <div className="incomes-filters">
            <div className="tabs">
              <button 
                className={activeTab === 'todas' ? 'active' : ''}
                onClick={() => handleTabChange('todas')}
              >
                Todas
              </button>
              <button 
                className={activeTab === 'este-mes' ? 'active' : ''}
                onClick={() => handleTabChange('este-mes')}
              >
                Este Mês
              </button>
              <button 
                className={activeTab === 'mes-passado' ? 'active' : ''}
                onClick={() => handleTabChange('mes-passado')}
              >
                Mês Passado
              </button>
            </div>

            <div className="filters-row">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Buscar receitas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select 
                value={categoryFilter} 
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="category-filter"
              >
                <option value="">Filtrar por categoria</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="incomes-content">
            <div className="incomes-summary">
              <h2>Todas as Receitas</h2>
              <p>Lista de todas as suas receitas registradas.</p>
            </div>

            <div className="incomes-table">
              <div className="table-header">
                <span>Data ↕</span>
                <span>Descrição ↕</span>
                <span>Categoria</span>
                <span>Valor ↕</span>
              </div>

              <div className="table-body">
                {filteredIncomes.length > 0 ? (
                  filteredIncomes.map(income => (
                    <div key={income.id} className="table-row">
                      <span>
                        {(() => {
                          if (!income.date) return new Date().toLocaleDateString('pt-BR');
                          
                          try {
                            const date = new Date(income.date);
                            return isNaN(date.getTime()) ? 'Data inválida' : date.toLocaleDateString('pt-BR');
                          } catch {
                            return 'Data inválida';
                          }
                        })()}
                      </span>
                      <span>{income.description}</span>
                      <span className="category-tag">{income.category}</span>
                      <span className="value">R$ {Number(income.value).toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <div className="no-incomes">
                    Nenhuma receita encontrada.
                  </div>
                )}
              </div>
            </div>

            <div className="incomes-footer">
              Mostrando {filteredIncomes.length} de {incomes.length} receitas
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}