import type { FixedExpense, Transaction } from './api';

// Mesma lógica de parse de data que o resto do app já usa (dataHora no
// formato "DD/MM/AAAA, HH:mm:ss" vindo do backend, com fallback pra
// Date ISO) -- centralizado aqui em vez de reimplementado por seção.
function parseTransactionDate(t: Transaction): Date {
  const raw = t.dataHora || t.data || t.criadoEm;
  if (raw && typeof raw === 'string' && raw.includes('/')) {
    const [datePart] = raw.split(', ');
    const [day, month, year] = datePart.split('/');
    return new Date(Number(year), Number(month) - 1, Number(day));
  }
  return raw ? new Date(raw) : new Date(0);
}

export interface RecentActivityItem {
  id: string;
  description: string;
  category: string;
  date: Date;
  value: number;
  type: 'receita' | 'despesa';
}

export function selectRecentActivity(transactions: Transaction[], limit = 5): RecentActivityItem[] {
  return transactions
    .filter((t) => !t.isTransferencia)
    .map((t) => ({
      id: t.id,
      description: t.descricao || 'Sem descrição',
      category: t.categoria || 'Outros',
      date: parseTransactionDate(t),
      value: Math.abs(t.valor || 0),
      type: (t.tipo?.toLowerCase() === 'receita' ? 'receita' : 'despesa') as 'receita' | 'despesa'
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);
}

export interface UpcomingBill {
  id: string;
  name: string;
  amount: number;
  dueDate: Date;
  daysUntilDue: number;
}

// Próxima ocorrência de um gasto fixo a partir do dia de vencimento --
// se o dia já passou neste mês, a próxima é mês que vem.
function nextOccurrence(diaVencimento: number, from: Date): Date {
  const candidate = new Date(from.getFullYear(), from.getMonth(), diaVencimento);
  if (candidate < from) {
    return new Date(from.getFullYear(), from.getMonth() + 1, diaVencimento);
  }
  return candidate;
}

export function selectUpcomingBills(fixedExpenses: FixedExpense[], limit = 5, from = new Date()): UpcomingBill[] {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return fixedExpenses
    .filter((f) => f.ativo)
    .map((f) => {
      const dueDate = nextOccurrence(f.diaVencimento, today);
      const daysUntilDue = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return { id: f.id, name: f.nome, amount: f.valor, dueDate, daysUntilDue };
    })
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, limit);
}
