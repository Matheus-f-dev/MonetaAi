import { useState, useEffect } from 'react';
import "../styles/pages/System.css";
import "../styles/components/TransactionModal.css";
import "../styles/components/ActivityHistory.css";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [transactions, setTransactions] = useState([]);
  const [chartData, setChartData] = useState(null);
  
  const userName = "Usuário";
  const salary = 5000;
  const progress = 40;
  
  // Função para buscar transações
  const fetchTransactions = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.uid || 'default-user';
      
      const response = await fetch(`http://localhost:3000/api/transactions/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.transactions);
        generateChartData(data.transactions);
      }
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
    }
  };
  
  // Buscar transações na inicialização
  useEffect(() => {
    fetchTransactions();
  }, []);
  
  // Gerar dados do gráfico baseado nas transações
  const generateChartData = (transactionsList) => {
    // Agrupar por data
    const groupedByDate = {};
    
    transactionsList.forEach(transaction => {
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
    
    // Ordenar datas e pegar últimos 12 pontos
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
      const [dayA, monthA, yearA] = a.split('/');
      const [dayB, monthB, yearB] = b.split('/');
      return new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB);
    }).slice(-12);
    
    const receitasData = sortedDates.map(date => groupedByDate[date].receitas);
    const despesasData = sortedDates.map(date => groupedByDate[date].despesas);
    
    setChartData({
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
    });
  };
  
  // Calcular totais
  const income = transactions
    .filter(t => t.tipo?.toLowerCase() === 'receita')
    .reduce((sum, t) => sum + Math.abs(t.valor || 0), 0);
    
  const expenses = transactions
    .filter(t => t.tipo?.toLowerCase() === 'despesa')
    .reduce((sum, t) => sum + Math.abs(t.valor || 0), 0);
    
  const balance = income - expenses;

  const bills = [
    { name: "Netflix",  due: "25/07", amount: 39.90 },
    { name: "Aluguel",  due: "10/07", amount: 850.00 },
    { name: "Internet", due: "15/07", amount: 119.90 },
  ];

  // Processar transações recentes para a tabela
  const recentTransactions = transactions
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
    .sort((a, b) => new Date(b.date) - new Date(a.date)) // Ordenar por data mais recente
    .slice(0, 5); // Pegar apenas as 5 mais recentes

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
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.uid || 'user-temp';
      
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
      
      const response = await fetch('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Transação adicionada com sucesso!');
        // Recarregar dados automaticamente
        await fetchTransactions();
      } else {
        alert('Erro: ' + result.message);
      }
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
      alert('Erro ao conectar com o servidor');
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
              <KPICards balance={balance} income={income} expenses={expenses} />
              
              <div className="sys-grid">
                {chartData && <ChartCard chartData={chartData} chartOptions={chartOptions} />}
                <SidePanel progress={progress} salary={salary} bills={bills} />
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


