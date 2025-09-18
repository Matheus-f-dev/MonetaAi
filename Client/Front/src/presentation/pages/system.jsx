import { useState, useEffect, useMemo } from 'react';
import "../styles/pages/System.css";
import "../styles/components/TransactionModal.css";
import "../styles/components/ActivityHistory.css";
import { useMonthlyProgress } from '../hooks/useMonthlyProgress';
import { useTheme } from '../hooks/useTheme';
import { useTransactionData } from '../hooks/useTransactionData';
import { useSystemSimple } from '../hooks/useSystemSimple';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

import { 
  Sidebar, 
  Topbar, 
  Tabs, 
  KPICards, 
  ChartCard, 
  SidePanel, 
  TransactionsTable 
} from '../components/system';
import { ActivityHistory } from '../components/system/ActivityHistory';
import { TransactionModal } from '../components/system/TransactionModal';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function System() {
  useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = user.nome || user.displayName || "Usuário";
  const userId = user.uid || 'default-user';
  
  const { transactions, createTransaction } = useTransactionData(userId);
  const { userSalary, chartFilter, setChartFilter } = useSystemSimple(userId);
  const [chartData, setChartData] = useState(null);
  const { progress, monthlyExpenses } = useMonthlyProgress(transactions, userSalary);
  
  useEffect(() => {
    if (transactions.length > 0) {
      const generateChartData = (transactionsList, filter = 'month') => {
        const now = new Date();
        let filteredTransactions = [];
        
        switch (filter) {
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filteredTransactions = transactionsList.filter(transaction => {
              const dateField = transaction.dataHora || transaction.data || transaction.criadoEm;
              if (!dateField) return false;
              
              let transactionDate;
              if (typeof dateField === 'string' && dateField.includes('/')) {
                const [datePart] = dateField.split(', ');
                const [day, month, year] = datePart.split('/');
                transactionDate = new Date(year, month - 1, day);
              } else {
                transactionDate = new Date(dateField);
              }
              
              return transactionDate >= weekAgo;
            });
            break;
          case 'year':
            filteredTransactions = transactionsList.filter(transaction => {
              const dateField = transaction.dataHora || transaction.data || transaction.criadoEm;
              if (!dateField) return false;
              
              let transactionDate;
              if (typeof dateField === 'string' && dateField.includes('/')) {
                const [datePart] = dateField.split(', ');
                const [day, month, year] = datePart.split('/');
                transactionDate = new Date(year, month - 1, day);
              } else {
                transactionDate = new Date(dateField);
              }
              
              return transactionDate.getFullYear() === now.getFullYear();
            });
            break;
          default:
            const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            filteredTransactions = transactionsList.filter(transaction => {
              const dateField = transaction.dataHora || transaction.data || transaction.criadoEm;
              if (!dateField) return false;
              
              let transactionDate;
              if (typeof dateField === 'string' && dateField.includes('/')) {
                const [datePart] = dateField.split(', ');
                const [day, month, year] = datePart.split('/');
                transactionDate = new Date(year, month - 1, day);
              } else {
                transactionDate = new Date(dateField);
              }
              
              return transactionDate >= threeMonthsAgo;
            });
        }
        
        const groupedByDate = {};
        
        filteredTransactions.forEach(transaction => {
          const dateField = transaction.dataHora || transaction.data || transaction.criadoEm;
          let date;
          
          if (dateField && typeof dateField === 'string' && dateField.includes('/')) {
            const [datePart] = dateField.split(', ');
            date = datePart;
          } else {
            date = new Date().toLocaleDateString('pt-BR');
          }
          
          if (!groupedByDate[date]) {
            groupedByDate[date] = { receitas: 0, despesas: 0 };
          }
          
          const valor = Math.abs(transaction.valor || 0);
          if (transaction.tipo?.toLowerCase() === 'receita') {
            groupedByDate[date].receitas += valor;
          } else {
            groupedByDate[date].despesas += valor;
          }
        });
        
        const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
          const [dayA, monthA, yearA] = a.split('/');
          const [dayB, monthB, yearB] = b.split('/');
          return new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB);
        });
        
        const receitasData = sortedDates.map(date => groupedByDate[date].receitas);
        const despesasData = sortedDates.map(date => groupedByDate[date].despesas);
        
        return {
          labels: sortedDates,
          datasets: [
            {
              label: 'Receitas',
              data: receitasData,
              borderColor: '#16a34a',
              backgroundColor: 'rgba(22, 163, 74, 0.1)',
              tension: 0.4,
            },
            {
              label: 'Despesas',
              data: despesasData,
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              tension: 0.4,
            }
          ],
        };
      };
      
      const data = generateChartData(transactions, chartFilter);
      setChartData(data);
    }
  }, [chartFilter, transactions]);
  const totals = useMemo(() => {
    const income = transactions
      .filter(t => t.tipo?.toLowerCase() === 'receita')
      .reduce((sum, t) => sum + Math.abs(t.valor || 0), 0);
      
    const expenses = transactions
      .filter(t => t.tipo?.toLowerCase() === 'despesa')
      .reduce((sum, t) => sum + Math.abs(t.valor || 0), 0);
      
    const balance = income - expenses;
    
    return { income, expenses, balance };
  }, [transactions]);

  const bills = [
    { name: "Netflix",  due: "25/07", amount: 39.90 },
    { name: "Aluguel",  due: "10/07", amount: 850.00 },
    { name: "Internet", due: "15/07", amount: 119.90 },
  ];

  const recentTransactions = useMemo(() => {
    return transactions
      .map(transaction => {
        const dateField = transaction.dataHora || transaction.data || transaction.criadoEm;
        let processedDate = dateField;
        
        if (dateField && typeof dateField === 'string' && dateField.includes('/')) {
          const [datePart] = dateField.split(', ');
          const [day, month, year] = datePart.split('/');
          processedDate = new Date(year, month - 1, day);
        }
        
        return {
          type: transaction.tipo?.toLowerCase() === 'receita' ? 'in' : 'out',
          desc: transaction.descricao || 'Sem descrição',
          category: transaction.categoria || 'Outros',
          date: processedDate ? 
            processedDate.toLocaleDateString('pt-BR') : 
            new Date().toLocaleDateString('pt-BR'),
          amount: transaction.tipo?.toLowerCase() === 'receita' ? 
            Math.abs(transaction.valor || 0) : 
            -Math.abs(transaction.valor || 0)
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [transactions]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return 'R$ ' + value.toLocaleString('pt-BR');
          }
        }
      }
    },
  };

  const handleNewTransaction = () => {
    setIsModalOpen(true);
  };

  const handleSubmitTransaction = async (transactionData) => {
    let formattedDate;
    if (transactionData.data) {
      const [year, month, day] = transactionData.data.split('-');
      const time = new Date().toLocaleTimeString('pt-BR');
      formattedDate = `${day}/${month}/${year}, ${time}`;
    } else {
      formattedDate = new Date().toLocaleString('pt-BR');
    }
    
    const payload = {
      userId,
      tipo: transactionData.tipo,
      valor: parseFloat(transactionData.valor),
      descricao: transactionData.descricao,
      categoria: transactionData.categoria,
      dataHora: formattedDate
    };
    
    const result = await createTransaction(payload);
    
    if (result.success) {
      alert('Transação adicionada com sucesso!');
    } else {
      alert('Erro: ' + result.message);
    }
  };

  return (
    <div className="sys-layout">
      <Sidebar />
      
      <main className="sys-main">
        <Topbar userName={userName} onNewTransaction={handleNewTransaction} />
        <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
        
        <section className="sys-panel">
          {activeTab === 'overview' && (
            <>
              <KPICards balance={totals.balance} income={totals.income} expenses={totals.expenses} />
              
              <div className="sys-grid">
                {chartData && (
                  <ChartCard 
                    chartData={chartData} 
                    chartOptions={chartOptions} 
                    activeFilter={chartFilter}
                    onFilterChange={(filter) => {
                      setChartFilter(filter);
                    }}
                  />
                )}
                <SidePanel progress={progress} salary={userSalary} monthlyExpenses={monthlyExpenses} bills={bills} />
              </div>
              
              <TransactionsTable transactions={recentTransactions} />
            </>
          )}
          
          {activeTab === 'future' && (
            <div className="future-balance">
              <h2>Saldo Futuro</h2>
              <p>Funcionalidade em desenvolvimento...</p>
            </div>
          )}
          
          {activeTab === 'activities' && (
            <ActivityHistory key={transactions.length} />
          )}
        </section>
      </main>
      
      <TransactionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitTransaction}
      />
    </div>
  );
}


