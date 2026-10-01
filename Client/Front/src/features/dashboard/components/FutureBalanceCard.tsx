import { Badge, Card, MoneyFigure, QueryState, Skeleton } from '../../../design-system';
import type { ProjectionResult } from '../api';
import styles from './FutureBalanceCard.module.css';

const TREND_LABEL: Record<ProjectionResult['tendencia'], string> = {
  crescendo: 'Crescendo',
  decaindo: 'Decaindo',
  estável: 'Estável'
};

const TREND_TONE: Record<ProjectionResult['tendencia'], 'positive' | 'negative' | 'neutral'> = {
  crescendo: 'positive',
  decaindo: 'negative',
  estável: 'neutral'
};

export interface FutureBalanceCardProps {
  projection: ProjectionResult | undefined;
  months: number;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function FutureBalanceCard({ projection, months, isLoading, isError, onRetry }: FutureBalanceCardProps) {
  const realistic = projection?.cenarios.realistic;
  const futureBalance = realistic?.[realistic.length - 1]?.balance ?? projection?.saldoAtual ?? 0;

  return (
    <Card>
      <p className={styles.title}>Saldo projetado</p>
      <p className={styles.subtitle}>Cenário realista, próximos {months} meses</p>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={onRetry}
        skeleton={<Skeleton height="2.5rem" />}
      >
        <div className={styles.row}>
          <div>
            <p className={styles.futureLabel}>Em {months} meses</p>
            <MoneyFigure value={futureBalance} sign="neutral" size="lg" />
          </div>
          {projection && (
            <Badge tone={TREND_TONE[projection.tendencia]} withDot>
              {TREND_LABEL[projection.tendencia]}
            </Badge>
          )}
        </div>
      </QueryState>
    </Card>
  );
}
