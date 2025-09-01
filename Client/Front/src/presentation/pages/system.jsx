import { useState } from 'react';
import "../styles/pages/System.css";
import "../styles/components/TransactionModal.css";
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
  
  // -> estes dados serão trocados pelo seu backend depois
  const userName   = "Usuário";
  const balance    = -2000;
  const income     = 0;
  const expenses   = 2000;
  const salary     = 5000;
  const progress   = 40; // %

  const bills = [
    { name: "Netflix",  due: "25/07", amount: 39.90 },
    { name: "Aluguel",  due: "10/07", amount: 850.00 },
    { name: "Internet", due: "15/07", amount: 119.90 },
  ];

  const transactions = [
    { type: "out", desc: "alimentacao", category: "Outras", date: "2025-08-12", amount: -2000.00 },
    // adicione mais linhas do backend aqui
  ];

  // Dados para o gráfico
  const chartData = {
    labels: ["15/07","16/07","18/07","20/07","25/07","27/07","31/07","02/08","06/08","10/08","11/08","12/08"],
    datasets: [
      {
        label: 'Receitas',
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5000],
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22, 163, 74, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Despesas',
        data: [200, 150, 300, 180, 850, 120, 400, 250, 180, 300, 200, 2000],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
      }
    ],
  };

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
        <Tabs />
        
        <section className="sys-panel">
          <KPICards balance={balance} income={income} expenses={expenses} />
          
          <div className="sys-grid">
            <ChartCard chartData={chartData} chartOptions={chartOptions} />
            <SidePanel progress={progress} salary={salary} bills={bills} />
          </div>
          
          <TransactionsTable transactions={transactions} />
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


