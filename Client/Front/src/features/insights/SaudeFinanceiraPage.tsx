import { useMemo, type CSSProperties } from 'react';
import { Badge, Card, QueryState, Skeleton } from '../../design-system';
import { useBalanceQuery, useCurrentUserId } from '../dashboard/queries';
import { useBudgetStatusQuery, useGoalsProgressQuery } from '../wealth/queries';
import { calculateHealthScore, type HealthBand } from './financialHealth';
import styles from './SaudeFinanceiraPage.module.css';

const BAND_TONE: Record<HealthBand, 'positive' | 'brand' | 'warning' | 'negative'> = {
  saudavel: 'positive',
  'em-dia': 'brand',
  atencao: 'warning',
  critico: 'negative'
};

const BAND_COLOR_VAR: Record<HealthBand, string> = {
  saudavel: 'var(--color-positive)',
  'em-dia': 'var(--color-brand)',
  atencao: 'var(--color-warning)',
  critico: 'var(--color-negative)'
};

export default function SaudeFinanceiraPage() {
  const userId = useCurrentUserId();
  const balanceQuery = useBalanceQuery(userId);
  const budgetsQuery = useBudgetStatusQuery(userId);
  const goalsQuery = useGoalsProgressQuery(userId);

  const isLoading = balanceQuery.isLoading || budgetsQuery.isLoading || goalsQuery.isLoading;
  const isError = balanceQuery.isError || budgetsQuery.isError || goalsQuery.isError;

  const result = useMemo(() => {
    if (!balanceQuery.data) return null;
    return calculateHealthScore(balanceQuery.data, budgetsQuery.data ?? [], goalsQuery.data ?? []);
  }, [balanceQuery.data, budgetsQuery.data, goalsQuery.data]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Saúde financeira</h1>
          <p className={styles.subtitle}>Um número só pra resumir receitas, orçamentos e metas -- atualizado a cada visita.</p>
        </div>
      </div>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={balanceQuery.refetch}
        skeleton={<Skeleton height="320px" />}
      >
        {result && (
          <>
            <Card>
              <div className={styles.scoreRow}>
                <div
                  className={styles.scoreRing}
                  style={
                    {
                      '--score-percent': `${result.score}%`,
                      '--score-color': BAND_COLOR_VAR[result.band]
                    } as CSSProperties
                  }
                >
                  <span className={styles.scoreNumber}>{result.score}</span>
                </div>
                <div>
                  <Badge tone={BAND_TONE[result.band]} withDot>
                    {result.bandLabel}
                  </Badge>
                  <p className={styles.scoreHint}>
                    Combina taxa de poupança do mês, orçamentos dentro do limite e progresso das suas metas.
                  </p>
                </div>
              </div>
            </Card>

            <div className={styles.grid}>
              {result.breakdown.map((item) => (
                <Card key={item.label}>
                  <div className={styles.breakdownHeader}>
                    <span className={styles.breakdownLabel}>{item.label}</span>
                    <span className={styles.breakdownWeight}>peso {item.weightPercent}%</span>
                  </div>
                  <div className={styles.track}>
                    <div className={styles.fill} style={{ width: `${item.score}%` }} />
                  </div>
                  <p className={styles.breakdownDetail}>{item.detail}</p>
                </Card>
              ))}
            </div>

            <Card>
              <h2 className={styles.sectionTitle}>O que ajudaria a melhorar</h2>
              <ul className={styles.tipsList}>
                {result.tips.map((tip, i) => (
                  <li key={i} className={styles.tipItem}>
                    {tip}
                  </li>
                ))}
              </ul>
            </Card>
          </>
        )}
      </QueryState>
    </div>
  );
}
