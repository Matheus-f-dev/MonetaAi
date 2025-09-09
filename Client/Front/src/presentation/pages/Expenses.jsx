import { useState, useEffect } from 'react';
import "../styles/pages/Expenses.css";
import { Sidebar } from '../components/system';
import { useTheme } from '../hooks/useTheme';

export default function Expenses() {
  useTheme();
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [activeTab, setActiveTab] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const userName = "Usuário";

  // Buscar despesas do banco de dados
  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user.uid || 'default-user';
        
        const response = await fetch(`http://localhost:3000/api/transactions/${userId}`);
        const data = await response.json();
        
        if (data.success) {
          // Filtrar apenas despesas
          const expensesData = data.transactions
            .filter(transaction => transaction.tipo && transaction.tipo.toLowerCase() === 'despesa')
            .map(transaction => {

              const dateField = transaction.dataHora || transaction.data || transaction.criadoEm;
              let processedDate = dateField;
              
              // Tratar formato brasileiro "01/09/2025, 14:02:47"
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
          
          console.log('Total de despesas encontradas:', expensesData.length);
          setExpenses(expensesData);
          setFilteredExpenses(expensesData);
        } else {
          console.log('Erro na resposta:', data);
        }
      } catch (error) {
        console.error('Erro ao buscar despesas:', error);
      }
    };
    
    fetchExpenses();
  }, []);

  // Filtrar despesas
  useEffect(() => {
    let filtered = expenses;

    // Filtro por período
    if (activeTab === 'este-mes') {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      filtered = filtered.filter(expense => {
        if (!expense.date) return false;
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      });
    } else if (activeTab === 'mes-passado') {
      const lastMonth = new Date().getMonth() - 1;
      const year = lastMonth < 0 ? new Date().getFullYear() - 1 : new Date().getFullYear();
      const month = lastMonth < 0 ? 11 : lastMonth;
      filtered = filtered.filter(expense => {
        if (!expense.date) return false;
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === month && expenseDate.getFullYear() === year;
      });
    }

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(expense => 
        expense.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por categoria
    if (categoryFilter) {
      filtered = filtered.filter(expense => expense.category === categoryFilter);
    }

    setFilteredExpenses(filtered);
  }, [expenses, activeTab, searchTerm, categoryFilter]);

  const categories = [...new Set(expenses.map(expense => expense.category))];

  return (
    <div className="sys-layout">
      <Sidebar />
      
      <main className="sys-main">
        
        <div className="expenses-container">
          <div className="expenses-header">
            <h1>Gerenciar Despesas</h1>
          </div>

          <div className="expenses-filters">
            <div className="tabs">
              <button 
                className={activeTab === 'todas' ? 'active' : ''}
                onClick={() => setActiveTab('todas')}
              >
                Todas
              </button>
              <button 
                className={activeTab === 'este-mes' ? 'active' : ''}
                onClick={() => setActiveTab('este-mes')}
              >
                Este Mês
              </button>
              <button 
                className={activeTab === 'mes-passado' ? 'active' : ''}
                onClick={() => setActiveTab('mes-passado')}
              >
                Mês Passado
              </button>
            </div>

            <div className="filters-row">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Buscar despesas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="category-filter"
              >
                <option value="">Filtrar por categoria</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="expenses-content">
            <div className="expenses-summary">
              <h2>Todas as Despesas</h2>
              <p>Lista de todas as suas despesas registradas.</p>
            </div>

            <div className="expenses-table">
              <div className="table-header">
                <span>Data ↕</span>
                <span>Descrição ↕</span>
                <span>Categoria</span>
                <span>Valor ↕</span>
              </div>

              <div className="table-body">
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map(expense => (
                    <div key={expense.id} className="table-row">
                      <span>
                        {(() => {
                          if (!expense.date) return new Date().toLocaleDateString('pt-BR');
                          
                          try {
                            const date = new Date(expense.date);
                            return isNaN(date.getTime()) ? 'Data inválida' : date.toLocaleDateString('pt-BR');
                          } catch {
                            return 'Data inválida';
                          }
                        })()}
                      </span>
                      <span>{expense.description}</span>
                      <span className="category-tag">{expense.category}</span>
                      <span className="value">R$ {Number(expense.value).toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <div className="no-expenses">
                    Nenhuma despesa encontrada.
                  </div>
                )}
              </div>
            </div>

            <div className="expenses-footer">
              Mostrando {filteredExpenses.length} de {expenses.length} despesas
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}