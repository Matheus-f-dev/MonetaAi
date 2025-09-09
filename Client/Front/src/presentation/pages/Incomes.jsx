import { useState, useEffect } from 'react';
import "../styles/pages/Incomes.css";
import { Sidebar } from '../components/system';
import { useTheme } from '../hooks/useTheme';

export default function Incomes() {
  useTheme();
  const [incomes, setIncomes] = useState([]);
  const [filteredIncomes, setFilteredIncomes] = useState([]);
  const [activeTab, setActiveTab] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const userName = "Usuário";

  // Buscar receitas do banco de dados
  useEffect(() => {
    const fetchIncomes = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user.uid || 'default-user';
        
        const response = await fetch(`http://localhost:3000/api/transactions/${userId}`);
        const data = await response.json();
        
        if (data.success) {
          // Filtrar apenas receitas
          const incomesData = data.transactions
            .filter(transaction => transaction.tipo && transaction.tipo.toLowerCase() === 'receita')
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
          
          console.log('Total de receitas encontradas:', incomesData.length);
          setIncomes(incomesData);
          setFilteredIncomes(incomesData);
        } else {
          console.log('Erro na resposta:', data);
        }
      } catch (error) {
        console.error('Erro ao buscar receitas:', error);
      }
    };
    
    fetchIncomes();
  }, []);

  // Filtrar receitas
  useEffect(() => {
    let filtered = incomes;

    // Filtro por período
    if (activeTab === 'este-mes') {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      filtered = filtered.filter(income => {
        if (!income.date) return false;
        const incomeDate = new Date(income.date);
        return incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear;
      });
    } else if (activeTab === 'mes-passado') {
      const lastMonth = new Date().getMonth() - 1;
      const year = lastMonth < 0 ? new Date().getFullYear() - 1 : new Date().getFullYear();
      const month = lastMonth < 0 ? 11 : lastMonth;
      filtered = filtered.filter(income => {
        if (!income.date) return false;
        const incomeDate = new Date(income.date);
        return incomeDate.getMonth() === month && incomeDate.getFullYear() === year;
      });
    }

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(income => 
        income.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por categoria
    if (categoryFilter) {
      filtered = filtered.filter(income => income.category === categoryFilter);
    }

    setFilteredIncomes(filtered);
  }, [incomes, activeTab, searchTerm, categoryFilter]);

  const categories = [...new Set(incomes.map(income => income.category))];

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
                  placeholder="Buscar receitas..."
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