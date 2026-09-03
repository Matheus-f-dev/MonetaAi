import { Card, MoneyFigure, QueryState, Skeleton } from '../../../design-system';
import type { Balance } from '../api';
import styles from './KpiSection.module.css';

export interface KpiSectionProps {
  balance: Balance | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

function KpiSkeleton() {
  return (
    <div className={styles.grid}>
      {[0, 1, 2].map((i) => (
        <Card perforated key={i}>
          <Skeleton width="55%" height="0.75rem" />
          <div style={{ marginTop: 12 }}>
            <Skeleton width="70%" height="2rem" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function KpiSection({ balance, isLoading, isError, onRetry }: KpiSectionProps) {
  return (
    <QueryState isLoading={isLoading} isError={isError} onRetry={onRetry} skeleton={<KpiSkeleton />}>
      <div className={styles.grid}>
        <Card perforated>
          <p className={styles.label}>Saldo atual</p>
          <p className={styles.sublabel}>Atualizado em tempo real</p>
          <MoneyFigure value={balance?.saldo ?? 0} sign="auto" size="xl" />
        </Card>
        <Card perforated>
          <p className={styles.label}>Receitas</p>
          <p className={styles.sublabel}>Total acumulado</p>
          <MoneyFigure value={balance?.receitas ?? 0} sign="positive" size="xl" />
        </Card>
        <Card perforated>
          <p className={styles.label}>Despesas</p>
          <p className={styles.sublabel}>Total acumulado</p>
          <MoneyFigure value={balance?.despesas ?? 0} sign="negative" size="xl" />
        </Card>
      </div>
    </QueryState>
  );
}
