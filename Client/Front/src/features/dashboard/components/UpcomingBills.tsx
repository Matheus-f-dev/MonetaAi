import { Card, MoneyFigure, QueryState, Skeleton } from '../../../design-system';
import type { UpcomingBill } from '../selectors';
import styles from './UpcomingBills.module.css';

function formatDue(bill: UpcomingBill): string {
  if (bill.daysUntilDue === 0) return 'Vence hoje';
  if (bill.daysUntilDue === 1) return 'Vence amanhã';
  if (bill.daysUntilDue <= 7) return `Vence em ${bill.daysUntilDue} dias`;
  return `Vence dia ${String(bill.dueDate.getDate()).padStart(2, '0')}/${String(bill.dueDate.getMonth() + 1).padStart(2, '0')}`;
}

export interface UpcomingBillsProps {
  bills: UpcomingBill[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function UpcomingBills({ bills, isLoading, isError, onRetry }: UpcomingBillsProps) {
  const isEmpty = !isLoading && !isError && (!bills || bills.length === 0);

  return (
    <Card>
      <p className={styles.title}>Próximas contas</p>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={isEmpty}
        onRetry={onRetry}
        skeleton={
          <div className={styles.list}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height="1.25rem" />
            ))}
          </div>
        }
        emptyTitle="Nenhum gasto fixo cadastrado"
        emptyDescription="Cadastre aluguel, assinaturas ou outras contas recorrentes pra acompanhar os vencimentos aqui."
      >
        <ul className={styles.list}>
          {bills?.map((bill) => (
            <li className={styles.item} key={bill.id}>
              <span className={styles.name}>{bill.name}</span>
              <span style={{ textAlign: 'right' }}>
                <MoneyFigure value={bill.amount} sign="neutral" size="sm" />
                <br />
                <span className={[styles.due, bill.daysUntilDue <= 3 && styles.dueSoon].filter(Boolean).join(' ')}>
                  {formatDue(bill)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </QueryState>
    </Card>
  );
}
