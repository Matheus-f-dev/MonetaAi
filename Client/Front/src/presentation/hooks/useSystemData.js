import { useState, useEffect, useMemo } from 'react';

export const useSystemData = (userId) => {
  const [userSalary, setUserSalary] = useState(0);
  const [chartData, setChartData] = useState(null);
  const [chartFilter, setChartFilter] = useState('month');

  const fetchUserData = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/user/${userId}`);
      
      if (!response.ok) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setUserSalary(user.salario || 0);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setUserSalary(data.user.salario || 0);
      } else {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setUserSalary(user.salario || 0);
      }
    } catch (error) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setUserSalary(user.salario || 0);
    }
  };

  const generateChartData = (transactions, filter = 'month') => {
    const now = new Date();
    let filteredTransactions = [];
    
    switch (filter) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredTransactions = transactions.filter(transaction => {
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
        filteredTransactions = transactions.filter(transaction => {
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
        filteredTransactions = transactions.filter(transaction => {
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

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  return {
    userSalary,
    chartData,
    chartFilter,
    setChartFilter,
    generateChartData,
    setChartData
  };
};