import { useState, useEffect } from 'react';
import { useTransactionData } from './useTransactionData';

export function useAnalytics(selectedPeriod, userId) {
  const { transactions } = useTransactionData(userId);
  
  const [analyticsData, setAnalyticsData] = useState({
    totals: { expenses: 0, income: 0, savings: 0 },
    percentageChanges: { expenses: 0, income: 0, savings: 0 },
    categoryData: [],
    evolutionData: [],
    topCategory: { name: 'Sem dados', percentage: 0 }
  });

  useEffect(() => {
    if (userId && transactions.length > 0) {
      const filteredTransactions = filterTransactionsByPeriod(transactions, selectedPeriod);
      const processedData = processAnalyticsData(filteredTransactions, transactions, selectedPeriod);
      setAnalyticsData(processedData);
    } else if (userId) {
      // Reset data when no transactions
      setAnalyticsData({
        totals: { expenses: 0, income: 0, savings: 0 },
        percentageChanges: { expenses: 0, income: 0, savings: 0 },
        categoryData: [],
        evolutionData: [],
        topCategory: { name: 'Sem dados', percentage: 0 },
        expensesTabData: {
          topCategory: { name: 'Sem dados', total: 0 },
          fastestGrowingCategory: { name: 'Sem dados', growth: 0 },
          dailyAverage: 0
        },
        cumulativeLineData: [],
        dailyData: []
      });
    }
  }, [transactions, selectedPeriod, userId]);

  const filterTransactionsByPeriod = (transactions, period) => {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'Este Mês':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'Últimos 3 Meses':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'Este Ano':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        return transactions;
    }

    return transactions.filter(t => {
      const date = getTransactionDate(t);
      return date >= startDate && date <= endDate;
    });
  };

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

  const processAnalyticsData = (currentTransactions, allTransactions, period) => {
    const expenses = currentTransactions
      .filter(t => t.tipo?.toLowerCase() === 'despesa')
      .reduce((sum, t) => sum + Math.abs(t.valor || 0), 0);
    
    const income = currentTransactions
      .filter(t => t.tipo?.toLowerCase() === 'receita')
      .reduce((sum, t) => sum + Math.abs(t.valor || 0), 0);
    
    const savings = income - expenses;

    // Calcular mudanças percentuais
    const previousPeriodTransactions = getPreviousPeriodTransactions(allTransactions, period);
    const prevExpenses = previousPeriodTransactions
      .filter(t => t.tipo?.toLowerCase() === 'despesa')
      .reduce((sum, t) => sum + Math.abs(t.valor || 0), 0);
    const prevIncome = previousPeriodTransactions
      .filter(t => t.tipo?.toLowerCase() === 'receita')
      .reduce((sum, t) => sum + Math.abs(t.valor || 0), 0);
    const prevSavings = prevIncome - prevExpenses;

    const calculatePercentageChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // Processar dados por categoria
    const categoryTotals = {};
    const expenseTransactions = currentTransactions.filter(t => t.tipo?.toLowerCase() === 'despesa');
    
    expenseTransactions.forEach(t => {
      const category = t.categoria || 'Outros';
      categoryTotals[category] = (categoryTotals[category] || 0) + Math.abs(t.valor || 0);
    });

    const totalExpenses = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
    const categoryData = Object.entries(categoryTotals)
      .map(([name, total]) => {
        const exactPercentage = (total / totalExpenses) * 100;
        return {
          name,
          total,
          percentage: exactPercentage < 1 ? Math.max(1, Math.round(exactPercentage)) : Math.round(exactPercentage),
          color: getCategoryColor(name)
        };
      })
      .sort((a, b) => b.total - a.total);

    const topCategory = categoryData[0] || { name: 'Moradia', percentage: 35 };

    // Dados de evolução baseados no período selecionado
    const evolutionData = generateEvolutionData(allTransactions, period);

    // Calcular valor máximo para escala do gráfico
    const maxValue = Math.max(...evolutionData.map(d => d.value), 1000);
    const roundedMax = Math.ceil(maxValue / 1000) * 1000;

    // Calcular dados específicos para tab de despesas
    const previousCategoryTotals = {};
    previousPeriodTransactions
      .filter(t => t.tipo?.toLowerCase() === 'despesa')
      .forEach(t => {
        const category = t.categoria || 'Outros';
        previousCategoryTotals[category] = (previousCategoryTotals[category] || 0) + Math.abs(t.valor || 0);
      });

    // Calcular crescimento por categoria
    let fastestGrowingCategory = { name: 'Sem dados', growth: 0 };
    let maxGrowth = -Infinity;
    
    Object.entries(categoryTotals).forEach(([category, currentTotal]) => {
      const previousTotal = previousCategoryTotals[category] || 0;
      if (previousTotal > 0) {
        const growth = ((currentTotal - previousTotal) / previousTotal) * 100;
        if (growth > maxGrowth) {
          maxGrowth = growth;
          fastestGrowingCategory = { name: category, growth: Math.round(growth) };
        }
      }
    });
    
    // Se não encontrou crescimento, usar a segunda maior categoria
    if (fastestGrowingCategory.name === 'Sem dados' && categoryData.length > 1) {
      fastestGrowingCategory = { name: categoryData[1].name, growth: 0 };
    }

    // Calcular número de dias no período
    const getDaysInPeriod = (period) => {
      const now = new Date();
      switch (period) {
        case 'Este Mês':
          return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        case 'Últimos 3 Meses':
          return 90;
        case 'Este Ano':
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          return Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000)) + 1;
        default:
          return 30;
      }
    };

    const expensesTabData = {
      topCategory: categoryData[0] || { name: 'Sem dados', total: 0 },
      fastestGrowingCategory,
      dailyAverage: expenses / getDaysInPeriod(period)
    };

    // Gerar dados de linha acumulativa
    const cumulativeLineData = generateCumulativeLineData(allTransactions, period);
    
    // Gerar dados diários usando todas as transações (a filtragem é feita dentro da função)
    const dailyData = generateDailyData(allTransactions, period);

    return {
      totals: { expenses, income, savings },
      percentageChanges: {
        expenses: calculatePercentageChange(expenses, prevExpenses),
        income: calculatePercentageChange(income, prevIncome),
        savings: calculatePercentageChange(savings, prevSavings)
      },
      categoryData: categoryData.length > 0 ? categoryData : [
        { name: 'Sem dados', total: 0, percentage: 100, color: '#6B7280' }
      ],
      evolutionData: evolutionData.length > 0 ? evolutionData : [
        { month: 'Jan', value: 0 },
        { month: 'Fev', value: 0 },
        { month: 'Mar', value: 0 },
        { month: 'Abr', value: 0 },
        { month: 'Mai', value: 0 },
        { month: 'Jun', value: 0 },
        { month: 'Jul', value: 0 }
      ],
      topCategory: topCategory.name !== 'Sem dados' ? topCategory : { name: 'Sem dados', percentage: 0 },
      expensesTabData,
      cumulativeLineData,
      dailyData
    };
  };

  const getPreviousPeriodTransactions = (transactions, period) => {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'Este Mês':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'Últimos 3 Meses':
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() - 2, 0);
        break;
      case 'Este Ano':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        return [];
    }

    return transactions.filter(t => {
      const date = getTransactionDate(t);
      return date >= startDate && date <= endDate;
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Alimentação': '#F59E0B',
      'Moradia': '#8B5CF6',
      'Transporte': '#10B981',
      'Lazer': '#EF4444',
      'Educação': '#3B82F6',
      'Saúde': '#06B6D4',
      'Outros': '#6B7280'
    };
    return colors[category] || '#6B7280';
  };

  const generateEvolutionData = (transactions, period) => {
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();
    const result = [];
    
    if (period === 'Este Mês') {
      // Mostrar apenas o mês atual
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const monthExpenses = transactions
        .filter(t => {
          const date = getTransactionDate(t);
          return date >= monthStart && date <= monthEnd && t.tipo?.toLowerCase() === 'despesa';
        })
        .reduce((sum, t) => sum + Math.abs(t.valor || 0), 0);
      
      result.push({
        month: monthNames[now.getMonth()],
        value: monthExpenses
      });
    } else if (period === 'Últimos 3 Meses') {
      // Mostrar últimos 3 meses
      for (let i = 2; i >= 0; i--) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
        
        const monthExpenses = transactions
          .filter(t => {
            const date = getTransactionDate(t);
            return date >= monthStart && date <= monthEnd && t.tipo?.toLowerCase() === 'despesa';
          })
          .reduce((sum, t) => sum + Math.abs(t.valor || 0), 0);
        
        result.push({
          month: monthNames[targetDate.getMonth()],
          value: monthExpenses
        });
      }
    } else {
      // Este Ano - mostrar todos os meses do ano
      for (let i = 0; i < 12; i++) {
        const monthStart = new Date(now.getFullYear(), i, 1);
        const monthEnd = new Date(now.getFullYear(), i + 1, 0);
        
        const monthExpenses = transactions
          .filter(t => {
            const date = getTransactionDate(t);
            return date >= monthStart && date <= monthEnd && t.tipo?.toLowerCase() === 'despesa';
          })
          .reduce((sum, t) => sum + Math.abs(t.valor || 0), 0);
        
        result.push({
          month: monthNames[i],
          value: monthExpenses
        });
      }
    }
    
    return result;
  };

  const generateCumulativeLineData = (transactions, period) => {
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();
    const result = [];
    let cumulative = 0;
    
    if (period === 'Este Mês') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const monthExpenses = transactions
        .filter(t => {
          const date = getTransactionDate(t);
          return date >= monthStart && date <= monthEnd && t.tipo?.toLowerCase() === 'despesa';
        })
        .reduce((sum, t) => sum + Math.abs(t.valor || 0), 0);
      
      result.push({ month: monthNames[now.getMonth()], value: monthExpenses });
    } else if (period === 'Últimos 3 Meses') {
      for (let i = 2; i >= 0; i--) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
        
        const monthExpenses = transactions
          .filter(t => {
            const date = getTransactionDate(t);
            return date >= monthStart && date <= monthEnd && t.tipo?.toLowerCase() === 'despesa';
          })
          .reduce((sum, t) => sum + Math.abs(t.valor || 0), 0);
        
        cumulative += monthExpenses;
        result.push({ month: monthNames[targetDate.getMonth()], value: cumulative });
      }
    } else {
      for (let i = 0; i < 12; i++) {
        const monthStart = new Date(now.getFullYear(), i, 1);
        const monthEnd = new Date(now.getFullYear(), i + 1, 0);
        
        const monthExpenses = transactions
          .filter(t => {
            const date = getTransactionDate(t);
            return date >= monthStart && date <= monthEnd && t.tipo?.toLowerCase() === 'despesa';
          })
          .reduce((sum, t) => sum + Math.abs(t.valor || 0), 0);
        
        cumulative += monthExpenses;
        result.push({ month: monthNames[i], value: cumulative });
      }
    }
    
    return result;
  };

  const generateDailyData = (transactions, period) => {
    const now = new Date();
    const result = [];
    
    // Filter transactions by the selected period first
    const filteredTransactions = filterTransactionsByPeriod(transactions, period)
      .filter(t => t.tipo?.toLowerCase() === 'despesa');
    
    if (period === 'Este Mês') {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dayStart = new Date(now.getFullYear(), now.getMonth(), day);
        const dayEnd = new Date(now.getFullYear(), now.getMonth(), day, 23, 59, 59);
        
        const dayExpenses = filteredTransactions
          .filter(t => {
            const date = getTransactionDate(t);
            return date >= dayStart && date <= dayEnd;
          })
          .reduce((sum, t) => sum + Math.abs(t.valor || 0), 0);
        
        result.push({ day: day.toString(), value: dayExpenses });
      }
    } else if (period === 'Últimos 3 Meses') {
      // Group by weeks for better visualization
      const startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      let currentDate = new Date(startDate);
      let weekNumber = 1;
      
      while (currentDate <= endDate) {
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate.getTime() + 6 * 24 * 60 * 60 * 1000);
        if (weekEnd > endDate) weekEnd.setTime(endDate.getTime());
        
        const weekExpenses = filteredTransactions
          .filter(t => {
            const date = getTransactionDate(t);
            return date >= weekStart && date <= weekEnd;
          })
          .reduce((sum, t) => sum + Math.abs(t.valor || 0), 0);
        
        result.push({ day: `S${weekNumber}`, value: weekExpenses });
        
        currentDate.setTime(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        weekNumber++;
      }
    } else {
      // Group by months for the year view
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      
      for (let month = 0; month < 12; month++) {
        const monthStart = new Date(now.getFullYear(), month, 1);
        const monthEnd = new Date(now.getFullYear(), month + 1, 0);
        
        const monthExpenses = filteredTransactions
          .filter(t => {
            const date = getTransactionDate(t);
            return date >= monthStart && date <= monthEnd;
          })
          .reduce((sum, t) => sum + Math.abs(t.valor || 0), 0);
        
        result.push({ day: monthNames[month], value: monthExpenses });
      }
    }
    
    return result;
  };

  return analyticsData;
}