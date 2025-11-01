import { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useTransactionData } from '../hooks/useTransactionData';
import { useReports } from '../hooks/useReports';
import { ReportsChart } from '../components/ReportsChart';
import { Sidebar } from '../components/system/Sidebar';
import '../styles/pages/Reports.css';

export default function Reports() {
  useTheme();
  const [activeTab, setActiveTab] = useState('resumo');
  const [selectedPeriod, setSelectedPeriod] = useState('Este Mês');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.uid || 'default-user';
  const { filteredTransactions, chartData, totals, getCategoriesData } = useReports(userId, selectedPeriod);
  
  useEffect(() => {
    const fetchPercentageChange = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/percentage-change/${userId}?period=${selectedPeriod}`);
        const data = await response.json();
        if (data.success) {
          setPercentageChange(data.percentageChange);
        }
      } catch (error) {
        console.error('Erro ao buscar porcentagens:', error);
      }
    };
    
    if (userId) {
      fetchPercentageChange();
    }
  }, [selectedPeriod, userId, totals]);

  const { income, expenses, balance } = totals;

  const [percentageChange, setPercentageChange] = useState({
    income: '+0%',
    expenses: '+0%',
    balance: '+0%'
  });
  

  
  const getTransactionDate = (transaction) => {
    const dateField = transaction.dataHora || transaction.data || transaction.criadoEm;
    if (!dateField) return new Date();
    
    if (typeof dateField === 'string' && dateField.includes('/')) {
      const [datePart] = dateField.split(', ');
      const [day, month, year] = datePart.split('/');
      return new Date(year, month - 1, day);
    }
    return new Date(dateField);
  };





  const exportToExcel = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    
    // Aba 1: Resumo Geral
    const resumoData = [
      ['RELATÓRIO FINANCEIRO - ' + selectedPeriod.toUpperCase()],
      [''],
      ['RESUMO GERAL'],
      ['Total de Receitas', 'R$ ' + income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })],
      ['Total de Despesas', 'R$ ' + expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })],
      ['Balanço', 'R$ ' + balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })]
    ];
    const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');
    
    // Aba 2: Transações Detalhadas
    const transacoesData = [
      ['DATA', 'DESCRIÇÃO', 'CATEGORIA', 'TIPO', 'VALOR']
    ];
    (filteredTransactions || []).forEach(t => {
      transacoesData.push([
        t.dataHora || t.data || t.criadoEm,
        t.descricao || '',
        t.categoria || 'Outros',
        t.tipo || '',
        'R$ ' + Math.abs(t.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
      ]);
    });
    const wsTransacoes = XLSX.utils.aoa_to_sheet(transacoesData);
    XLSX.utils.book_append_sheet(wb, wsTransacoes, 'Transações');
    
    // Aba 3: Análise por Categorias
    const categoriasData = [
      ['CATEGORIA', 'TIPO', 'VALOR TOTAL', 'PERCENTUAL']
    ];
    getCategoriesData().forEach(cat => {
      categoriasData.push([
        cat.name,
        cat.type === 'positive' ? 'Receita' : 'Despesa',
        'R$ ' + cat.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        cat.percentage + '%'
      ]);
    });
    const wsCategorias = XLSX.utils.aoa_to_sheet(categoriasData);
    XLSX.utils.book_append_sheet(wb, wsCategorias, 'Categorias');
    
    // Aba 4: Evolução Mensal (se houver dados do gráfico)
    if (chartData) {
      const evolucaoData = [
        ['MÊS', 'RECEITAS', 'DESPESAS', 'SALDO']
      ];
      chartData.labels.forEach((label, index) => {
        evolucaoData.push([
          label,
          'R$ ' + (chartData.receitas[index] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
          'R$ ' + (chartData.despesas[index] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
          'R$ ' + (chartData.saldo[index] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
        ]);
      });
      const wsEvolucao = XLSX.utils.aoa_to_sheet(evolucaoData);
      XLSX.utils.book_append_sheet(wb, wsEvolucao, 'Evolução');
    }
    
    // Gerar nome do arquivo
    const now = new Date();
    const fileName = `relatorio-financeiro-${selectedPeriod.toLowerCase().replace(' ', '-')}-${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}.xlsx`;
    
    // Download
    XLSX.writeFile(wb, fileName);
  };



  return (
    <div className="sys-layout">
      <Sidebar />
      <main className="reports-main">
        <div className="reports-container">
        <div className="reports-header">
          <h1>Relatórios Financeiros</h1>
          <div className="reports-controls">
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="period-select"
            >
              <option>Este Mês</option>
              <option>Últimos 3 Meses</option>
              <option>Este Ano</option>
            </select>
            <button className="export-btn" onClick={exportToExcel}>
              📥 Exportar
            </button>
          </div>
        </div>

        <div className="reports-tabs">
          <button 
            className={`tab ${activeTab === 'resumo' ? 'active' : ''}`}
            onClick={() => setActiveTab('resumo')}
          >
            Resumo
          </button>
          <button 
            className={`tab ${activeTab === 'receitas-despesas' ? 'active' : ''}`}
            onClick={() => setActiveTab('receitas-despesas')}
          >
            Receitas e Despesas
          </button>
          <button 
            className={`tab ${activeTab === 'categorias' ? 'active' : ''}`}
            onClick={() => setActiveTab('categorias')}
          >
            Categorias
          </button>
        </div>

        <div className="kpi-cards">
          <div className="kpi-card">
            <h3>Total de Receitas</h3>
            <div className="kpi-value positive">R$ {income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <div className={`kpi-change ${percentageChange.income.startsWith('+') ? 'positive' : 'negative'}`}>{percentageChange.income} em relação ao período anterior</div>
          </div>
          <div className="kpi-card">
            <h3>Total de Despesas</h3>
            <div className="kpi-value negative">R$ {expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <div className={`kpi-change ${percentageChange.expenses.startsWith('+') ? 'negative' : 'positive'}`}>{percentageChange.expenses} em relação ao período anterior</div>
          </div>
          <div className="kpi-card">
            <h3>Balanço Mensal</h3>
            <div className={`kpi-value ${balance >= 0 ? 'positive' : 'negative'}`}>R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <div className={`kpi-change ${percentageChange.balance.startsWith('+') ? 'positive' : 'negative'}`}>{percentageChange.balance} em relação ao período anterior</div>
          </div>
        </div>

        {activeTab === 'resumo' && (
          <div className="chart-section">
            <div className="chart-header">
              <h2>Evolução Financeira</h2>
              <p>Comparativo de receitas, despesas e saldo - {selectedPeriod}</p>
            </div>
            <ReportsChart data={chartData} />
          </div>
        )}

        {activeTab === 'receitas-despesas' && (
          <div className="transactions-section">
            <div className="transactions-grid">
              <div className="transactions-column">
                <h3>Receitas ({selectedPeriod})</h3>
                <div className="transactions-list">
                  {(filteredTransactions || [])
                    .filter(t => t.tipo?.toLowerCase() === 'receita')
                    .map((transaction, index) => (
                      <div key={index} className="transaction-item positive">
                        <div className="transaction-info">
                          <span className="transaction-description">{transaction.descricao}</span>
                          <span className="transaction-date">{transaction.dataHora || transaction.data}</span>
                        </div>
                        <span className="transaction-value">+R$ {Math.abs(transaction.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
              <div className="transactions-column">
                <h3>Despesas ({selectedPeriod})</h3>
                <div className="transactions-list">
                  {(filteredTransactions || [])
                    .filter(t => t.tipo?.toLowerCase() === 'despesa')
                    .map((transaction, index) => (
                      <div key={index} className="transaction-item negative">
                        <div className="transaction-info">
                          <span className="transaction-description">{transaction.descricao}</span>
                          <span className="transaction-date">{transaction.dataHora || transaction.data}</span>
                        </div>
                        <span className="transaction-value">-R$ {Math.abs(transaction.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'categorias' && (
          <div className="categories-section">
            <div className="categories-grid">
              {getCategoriesData().map((category, index) => (
                <div key={index} className="category-card">
                  <div className="category-header">
                    <h4>{category.name}</h4>
                    <span className={`category-total ${category.type}`}>
                      R$ {category.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="category-percentage">
                    {category.percentage}% do total
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}