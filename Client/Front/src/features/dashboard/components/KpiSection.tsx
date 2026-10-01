import { Card, MoneyFigure, QueryState, Skeleton } from '../../../design-system';
import type { Balance } from '../api';
import type { MonthlyNet } from '../selectors';
import styles from './KpiSection.module.css';

export interface KpiSectionProps {
  balance: Balance | undefined;
  monthlyNet: MonthlyNet | undefined;
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

export function KpiSection({ balance, monthlyNet, isLoading, isError, onRetry }: KpiSectionProps) {
  const netSign = monthlyNet && monthlyNet.net >= 0 ? 'positive' : 'negative';

  return (
    <QueryState isLoading={isLoading} isError={isError} onRetry={onRetry} skeleton={<KpiSkeleton />}>
      <div className={styles.grid}>
        <Card perforated>
          <p className={styles.label}>Saldo atual</p>
          <p className={styles.sublabel}>Atualizado em tempo real</p>
          <MoneyFigure value={balance?.saldo ?? 0} sign="auto" size="xl" />

          {/* Mesma ideia do "▲ +8,2% vs agosto" embaixo do saldo consolidado
              no mockup da landing -- aqui com dado de verdade (receitas -
              despesas do mês corrente, já calculado do que a página buscou
              pra outros cards, sem request nova). Some quando ainda não há
              nenhuma transação no mês -- "▲ R$0,00 este mês" pareceria dado
              real sem ser. */}
          {monthlyNet?.hasData && (
            <p className={[styles.delta, styles[netSign]].filter(Boolean).join(' ')}>
              <span className={styles.deltaArrow} aria-hidden="true">
                {netSign === 'positive' ? '▲' : '▼'}
              </span>
              <MoneyFigure value={Math.abs(monthlyNet.net)} sign={netSign} size="sm" />
              <span>este mês</span>
            </p>
          )}
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
