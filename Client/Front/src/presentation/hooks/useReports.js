import { useState, useEffect, useMemo } from 'react';
import { useTransactionData } from './useTransactionData';

export const useReports = (userId, selectedPeriod) => {
  const [chartData, setChartData] = useState(null);
  const { transactions, fetchTransactions } = useTransactionData(userId);
  
  useEffect(() => {
    const loadReportsData = async () => {
      if (!userId) return;
      
      const filters = getPeriodFilters(selectedPeriod);
      await fetchTransactions(filters);
    };
    
    loadReportsData();
  }, [selectedPeriod, userId]);
  
  const getPeriodFilters = (period) => {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'Este Mês':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        break;
      case 'Últimos 3 Meses':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0];
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        break;
      case 'Este Ano':
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        endDate = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
        break;
      default:
        return {};
    }

    return { startDate, endDate };
  };

  const filteredTransactions = transactions;

  const generateChartData = (transactionsList) => {
    const monthlyData = {};
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    const now = new Date();
    let monthsToShow = 6;
    let startMonth = 5;
    
    if (selectedPeriod === 'Este Mês') {
      monthsToShow = 1;
      startMonth = 0;
    } else if (selectedPeriod === 'Últimos 3 Meses') {
      monthsToShow = 3;
      startMonth = 2;
    } else if (selectedPeriod === 'Este Ano') {
      monthsToShow = 12;
      startMonth = 11;
    }
    
    if (selectedPeriod === 'Este Ano') {
      // Para ano completo, mostrar de janeiro a dezembro
      for (let month = 0; month < 12; month++) {
        const date = new Date(now.getFullYear(), month, 1);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        const monthName = months[date.getMonth()];
        monthlyData[monthKey] = {
          name: monthName,
          receitas: 0,
          despesas: 0,
          saldo: 0
        };
      }
    } else {
      // Para outros períodos, manter lógica atual
      for (let i = startMonth; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        const monthName = months[date.getMonth()];
        monthlyData[monthKey] = {
          name: monthName,
          receitas: 0,
          despesas: 0,
          saldo: 0
        };
      }
    }

    (transactionsList || []).forEach(transaction => {
      const dateField = transaction.dataHora || transaction.data || transaction.criadoEm;
      if (!dateField) return;

      let transactionDate;
      if (typeof dateField === 'string' && dateField.includes('/')) {
        const [datePart] = dateField.split(', ');
        const [day, month, year] = datePart.split('/');
        transactionDate = new Date(year, month - 1, day);
      } else {
        transactionDate = new Date(dateField);
      }

      const monthKey = `${transactionDate.getFullYear()}-${transactionDate.getMonth()}`;
      if (monthlyData[monthKey]) {
        const valor = Math.abs(transaction.valor || 0);
        if (transaction.tipo?.toLowerCase() === 'receita') {
          monthlyData[monthKey].receitas += valor;
        } else {
          monthlyData[monthKey].despesas += valor;
        }
        monthlyData[monthKey].saldo = monthlyData[monthKey].receitas - monthlyData[monthKey].despesas;
      }
    });

    const sortedData = selectedPeriod === 'Este Ano' 
      ? Object.keys(monthlyData).sort().map(key => monthlyData[key])
      : Object.values(monthlyData);
    return {
      labels: sortedData.map(d => d.name),
      receitas: sortedData.map(d => d.receitas),
      despesas: sortedData.map(d => d.despesas),
      saldo: sortedData.map(d => d.saldo)
    };
  };

  useEffect(() => {
    if (transactions.length > 0) {
      const data = generateChartData(transactions);
      setChartData(data);
    }
  }, [transactions, selectedPeriod]);

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

  const getCategoriesData = () => {
    const categories = {};
    const { expenses: totalDespesas } = totals;
    
    // Processar apenas despesas
    transactions
      .filter(t => t.tipo?.toLowerCase() === 'despesa')
      .forEach(transaction => {
        const category = transaction.categoria || 'Outros';
        const amount = Math.abs(transaction.valor || 0);
        
        if (!categories[category]) {
          categories[category] = { total: 0, type: 'negative' };
        }
        categories[category].total += amount;
      });
    
    return Object.entries(categories).map(([name, data]) => ({
      name,
      total: data.total,
      type: data.type,
      percentage: totalDespesas > 0 ? ((data.total / totalDespesas) * 100).toFixed(1) : 0
    })).sort((a, b) => b.total - a.total);
  };

  return {
    filteredTransactions: transactions,
    chartData,
    totals,
    getCategoriesData
  };
};