import { Card, MoneyFigure, QueryState, Skeleton } from '../../../design-system';
import styles from './MonthlyProgressCard.module.css';

export interface MonthlyProgressCardProps {
  progress: number;
  monthlyExpenses: number;
  salary: number;
  isOverBudget: boolean;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function MonthlyProgressCard({
  progress,
  monthlyExpenses,
  salary,
  isOverBudget,
  isLoading,
  isError,
  onRetry
}: MonthlyProgressCardProps) {
  const isEmpty = !isLoading && !isError && salary <= 0;
  const clamped = Math.min(progress, 100);

  return (
    <Card>
      <p className={styles.title}>Progresso do mês</p>
      <p className={styles.subtitle}>Quanto do salário já foi gasto</p>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={isEmpty}
        onRetry={onRetry}
        skeleton={<Skeleton height="10px" />}
        emptyTitle="Salário ainda não informado"
        emptyDescription="Preencha o salário no seu perfil pra acompanhar quanto do mês já foi gasto."
      >
        <div className={styles.track}>
          <div
            className={[styles.fill, isOverBudget && styles.fillOver].filter(Boolean).join(' ')}
            style={{ width: `${clamped}%` }}
          />
        </div>
        <div className={styles.footer}>
          <span>
            <MoneyFigure value={monthlyExpenses} sign="neutral" size="sm" /> de{' '}
            <MoneyFigure value={salary} sign="neutral" size="sm" />
          </span>
          <span className={styles.percent}>{progress.toFixed(0)}%</span>
        </div>
      </QueryState>
    </Card>
  );
}
