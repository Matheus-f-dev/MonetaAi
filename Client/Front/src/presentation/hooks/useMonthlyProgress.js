import { useMemo } from 'react';

export function useMonthlyProgress(transactions, salary) {
  return useMemo(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    // Filtrar despesas do mês atual
    const monthlyExpenses = transactions
      .filter(transaction => {
        if (transaction.tipo?.toLowerCase() !== 'despesa') return false;
        
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
        
        return transactionDate.getMonth() + 1 === currentMonth && 
               transactionDate.getFullYear() === currentYear;
      })
      .reduce((sum, transaction) => sum + Math.abs(transaction.valor || 0), 0);
    
    // Calcular porcentagem (despesas / salário * 100)
    const progressPercentage = salary > 0 ? (monthlyExpenses / salary) * 100 : 0;
    
    return {
      progress: progressPercentage,
      monthlyExpenses,
      isOverBudget: progressPercentage > 100,
      remainingBudget: Math.max(salary - monthlyExpenses, 0)
    };
  }, [transactions, salary]);
}