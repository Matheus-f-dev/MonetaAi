import { useState } from 'react';
import { useMonthlyProgress } from '../../presentation/hooks/useMonthlyProgress';
import { KpiSection } from './components/KpiSection';
import { SpendingChart } from './components/SpendingChart';
import { MonthlyProgressCard } from './components/MonthlyProgressCard';
import { FutureBalanceCard } from './components/FutureBalanceCard';
import { UpcomingBills } from './components/UpcomingBills';
import { RecentActivity } from './components/RecentActivity';
import {
  useBalanceQuery,
  useChartDataQuery,
  useCurrentUserId,
  useFixedExpensesQuery,
  useProjectionQuery,
  useTransactionsQuery,
  useUserProfileQuery
} from './queries';
import { selectRecentActivity, selectUpcomingBills } from './selectors';
import styles from './DashboardPage.module.css';

const PROJECTION_MONTHS = 6;

/**
 * Fase 2 do redesign. Reconstrução completa do dashboard -- KPIs, gráfico,
 * progresso mensal, saldo projetado, próximas contas, atividade recente.
 * Escopo deliberadamente sem criação de transação: o modal "Nova
 * Transação" (Factory + Strategy) é reconstruído de verdade na Fase 3
 * (Movimentações), que é dona dele -- fazer uma versão reduzida agora só
 * pra refazer inteira depois não valeria o esforço.
 */
export default function DashboardPage() {
  const userId = useCurrentUserId();
  const [chartFilter, setChartFilter] = useState('month');

  const userQuery = useUserProfileQuery(userId);
  const balanceQuery = useBalanceQuery(userId);
  const chartQuery = useChartDataQuery(userId, chartFilter);
  const transactionsQuery = useTransactionsQuery(userId);
  const fixedExpensesQuery = useFixedExpensesQuery(userId);
  const projectionQuery = useProjectionQuery(userId, transactionsQuery.data, PROJECTION_MONTHS);

  const salary = userQuery.data?.salario ?? 0;
  const monthlyProgress = useMonthlyProgress(transactionsQuery.data ?? [], salary);

  const recentActivity = transactionsQuery.data ? selectRecentActivity(transactionsQuery.data) : undefined;
  const upcomingBills = fixedExpensesQuery.data ? selectUpcomingBills(fixedExpensesQuery.data) : undefined;

  const firstName = (userQuery.data?.nome || '').split(' ')[0];

  return (
    <div className={styles.page}>
      <div>
        <h1 className={styles.greeting}>{firstName ? `Olá, ${firstName}` : 'Olá'}</h1>
        <p className={styles.greetingSub}>Aqui está o resumo da sua vida financeira.</p>
      </div>

      <KpiSection
        balance={balanceQuery.data}
        isLoading={balanceQuery.isLoading}
        isError={balanceQuery.isError}
        onRetry={balanceQuery.refetch}
      />

      <div className={styles.mainGrid}>
        <SpendingChart
          data={chartQuery.data}
          filter={chartFilter}
          onFilterChange={setChartFilter}
          isLoading={chartQuery.isLoading}
          isError={chartQuery.isError}
          onRetry={chartQuery.refetch}
        />

        <div className={styles.sideStack}>
          <MonthlyProgressCard
            progress={monthlyProgress.progress}
            monthlyExpenses={monthlyProgress.monthlyExpenses}
            salary={salary}
            isOverBudget={monthlyProgress.isOverBudget}
            isLoading={userQuery.isLoading || transactionsQuery.isLoading}
            isError={userQuery.isError || transactionsQuery.isError}
            onRetry={() => {
              userQuery.refetch();
              transactionsQuery.refetch();
            }}
          />

          <FutureBalanceCard
            projection={projectionQuery.data}
            months={PROJECTION_MONTHS}
            isLoading={projectionQuery.isLoading || transactionsQuery.isLoading}
            isError={projectionQuery.isError}
            onRetry={projectionQuery.refetch}
          />

          <UpcomingBills
            bills={upcomingBills}
            isLoading={fixedExpensesQuery.isLoading}
            isError={fixedExpensesQuery.isError}
            onRetry={fixedExpensesQuery.refetch}
          />
        </div>
      </div>

      <RecentActivity
        items={recentActivity}
        isLoading={transactionsQuery.isLoading}
        isError={transactionsQuery.isError}
        onRetry={transactionsQuery.refetch}
      />
    </div>
  );
}
