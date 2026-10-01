import { useMemo, useState } from 'react';
import { Card, MoneyFigure, QueryState, Skeleton } from '../../design-system';
import type { RecurringItem } from '../movements/api';
import { useCurrentUserId, useRecurringItemsQuery } from '../movements/queries';
import { useCardsQuery } from '../wealth/queries';
import styles from './CalendarioPage.module.css';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface DayEntry {
  kind: 'expense' | 'income' | 'card';
  label: string;
  valor: number;
  status?: RecurringItem['status'];
}

/**
 * Ideia nova (não pedida, "pensa fora da caixa"): gastos fixos, receita
 * recorrente e fatura de cartão já existem cada um na própria lista, mas
 * nenhuma tela respondia "o que vence nos próximos dias" de relance --
 * só dava pra saber abrindo as 3 telas e cruzando o dia na cabeça. Um
 * calendário mensal junta os três num grid só, sem nenhuma rota nova no
 * backend (useRecurringItemsQuery + useCardsQuery já existem).
 */
export default function CalendarioPage() {
  const userId = useCurrentUserId();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const expensesQuery = useRecurringItemsQuery('expense', userId);
  const incomesQuery = useRecurringItemsQuery('income', userId);
  const cardsQuery = useCardsQuery(userId);

  const isLoading = expensesQuery.isLoading || incomesQuery.isLoading || cardsQuery.isLoading;
  const isError = expensesQuery.isError || incomesQuery.isError || cardsQuery.isError;

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  // Cartão não tem clamp de dia no backend (diaVencimento pode chegar
  // "31" num mês de 30 dias) -- os gastos/receitas fixos já vêm
  // clampados em 1-28 (ver FixedExpenseController/FixedIncomeController),
  // então só o cartão precisa do Math.min aqui.
  const entriesByDay = useMemo(() => {
    const map = new Map<number, DayEntry[]>();
    function push(day: number, entry: DayEntry) {
      const clamped = Math.min(Math.max(1, day || 1), daysInMonth);
      const list = map.get(clamped) ?? [];
      list.push(entry);
      map.set(clamped, list);
    }
    (expensesQuery.data ?? []).forEach((item) =>
      push(item.dia, { kind: 'expense', label: item.nome, valor: item.valor, status: item.status })
    );
    (incomesQuery.data ?? []).forEach((item) =>
      push(item.dia, { kind: 'income', label: item.nome, valor: item.valor, status: item.status })
    );
    (cardsQuery.data ?? []).forEach((card) =>
      push(card.diaVencimento, { kind: 'card', label: `Fatura ${card.nome}`, valor: 0 })
    );
    return map;
  }, [expensesQuery.data, incomesQuery.data, cardsQuery.data, daysInMonth]);

  const cells = useMemo(() => {
    const leading: Array<number | null> = Array.from({ length: firstWeekday }, () => null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    return [...leading, ...days];
  }, [firstWeekday, daysInMonth]);

  const totals = useMemo(() => {
    let despesas = 0;
    let receitas = 0;
    entriesByDay.forEach((list) => {
      list.forEach((entry) => {
        if (entry.kind === 'expense') despesas += entry.valor;
        if (entry.kind === 'income') receitas += entry.valor;
      });
    });
    return { despesas, receitas };
  }, [entriesByDay]);

  function changeMonth(delta: number) {
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Calendário de contas</h1>
          <p className={styles.subtitle}>Gastos fixos, receita recorrente e faturas de cartão, por dia do mês.</p>
        </div>
      </div>

      <div className={styles.summary}>
        <span className={styles.summaryItem}>
          Total fixo do mês <MoneyFigure value={totals.despesas} sign="negative" size="sm" />
        </span>
        <span className={styles.summaryItem}>
          Receita recorrente <MoneyFigure value={totals.receitas} sign="positive" size="sm" />
        </span>
      </div>

      <Card>
        <div className={styles.monthNav}>
          <button type="button" className={styles.navButton} onClick={() => changeMonth(-1)} aria-label="Mês anterior">
            ‹
          </button>
          <span className={styles.monthLabel}>
            {MONTH_NAMES[month]} de {year}
          </span>
          <button type="button" className={styles.navButton} onClick={() => changeMonth(1)} aria-label="Próximo mês">
            ›
          </button>
        </div>

        <QueryState isLoading={isLoading} isError={isError} onRetry={expensesQuery.refetch} skeleton={<Skeleton height="420px" />}>
          <div className={styles.weekdays}>
            {WEEKDAYS.map((w) => (
              <span key={w} className={styles.weekday}>
                {w}
              </span>
            ))}
          </div>
          <div className={styles.grid}>
            {cells.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} className={styles.emptyCell} />;
              const entries = entriesByDay.get(day) ?? [];
              const isToday = isCurrentMonth && today.getDate() === day;
              return (
                <div key={day} className={[styles.cell, isToday && styles.cellToday].filter(Boolean).join(' ')}>
                  <span className={styles.dayNumber}>{day}</span>
                  <div className={styles.chips}>
                    {entries.slice(0, 3).map((entry, i) => (
                      <span
                        key={i}
                        className={[styles.chip, styles[`chip-${entry.kind}`], entry.status === 'late' && styles.chipLate]
                          .filter(Boolean)
                          .join(' ')}
                        title={entry.label}
                      >
                        {entry.label}
                      </span>
                    ))}
                    {entries.length > 3 && <span className={styles.chipMore}>+{entries.length - 3}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </QueryState>
      </Card>
    </div>
  );
}
