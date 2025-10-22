import { useState, useEffect, useMemo } from 'react';
import "../styles/pages/System.css";
import "../styles/components/TransactionModal.css";
import "../styles/components/ActivityHistory.css";
import "../styles/components/ObserverLog.css";
import { useMonthlyProgress } from '../hooks/useMonthlyProgress';
import { useTheme } from '../hooks/useTheme';
import { useTransactionData } from '../hooks/useTransactionData';
import { useSystemSimple } from '../hooks/useSystemSimple';
import { useTransactions } from '../hooks/useTransactions';
import { useToast } from '../hooks/useToast';

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
import { ObserverLog } from '../components/system/ObserverLog';
import { FutureBalance } from '../components/system/FutureBalance';
import '../styles/components/FutureBalance.css';

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
  const { addToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = user.nome || user.displayName || "Usuário";
  const userId = user.uid || 'default-user';
  
  const { transactions, createTransaction, fetchTransactions, fetchChartData } = useTransactionData(userId);
  const { userSalary, chartFilter, setChartFilter } = useSystemSimple(userId);
  const { notifyNewTransaction } = useTransactions();
  const [chartData, setChartData] = useState(null);
  const { progress, monthlyExpenses } = useMonthlyProgress(transactions, userSalary);
  
  useEffect(() => {
    const loadChartData = async () => {
      const data = await fetchChartData(chartFilter);
      if (data) {
        setChartData(data);
      }
    };
    
    loadChartData();
  }, [chartFilter, fetchChartData]);
  
  useEffect(() => {
    if (!isModalOpen) {
      fetchTransactions();
    }
  }, [isModalOpen, fetchTransactions]);
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
        let processedDate;
        let displayDate;
        
        if (dateField && typeof dateField === 'string' && dateField.includes('/')) {
          const [datePart] = dateField.split(', ');
          const [day, month, year] = datePart.split('/');
          processedDate = new Date(year, month - 1, day);
          displayDate = datePart;
        } else if (dateField) {
          processedDate = new Date(dateField);
          displayDate = processedDate.toLocaleDateString('pt-BR');
        } else {
          processedDate = new Date();
          displayDate = processedDate.toLocaleDateString('pt-BR');
        }
        
        return {
          type: transaction.tipo?.toLowerCase() === 'receita' ? 'in' : 'out',
          desc: transaction.descricao || 'Sem descrição',
          category: transaction.categoria || 'Outros',
          date: displayDate,
          amount: transaction.tipo?.toLowerCase() === 'receita' ? 
            Math.abs(transaction.valor || 0) : 
            -Math.abs(transaction.valor || 0),
          sortDate: processedDate
        };
      })
      .sort((a, b) => b.sortDate - a.sortDate)
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
      // Observer Pattern - Notificar sobre nova transação
      notifyNewTransaction(payload);
      addToast('Transação adicionada com sucesso!', 'success');
    } else {
      addToast('Erro: ' + result.message, 'error');
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
                      fetchTransactions({ filter });
                    }}
                  />
                )}
                <SidePanel progress={progress} salary={userSalary} monthlyExpenses={monthlyExpenses} bills={bills} />
              </div>
              
              <TransactionsTable transactions={recentTransactions} />
            </>
          )}
          
          {activeTab === 'future' && (
            <FutureBalance 
              transactions={transactions} 
              userSalary={userSalary}
            />
          )}
          
          {activeTab === 'activities' && (
            <>
              <ObserverLog />
              <ActivityHistory key={transactions.length} />
            </>
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


