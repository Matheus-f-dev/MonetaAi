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
        // Perna de saída de uma transferência entre contas próprias não é
        // gasto de verdade -- sem isso, transferir pra poupança inflava o
        // "quanto do salário já foi gasto" (achado testando a Fase 4, ao
        // usar a transferência entre contas de Contas).
        if (transaction.isTransferencia) return false;

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