import { Badge, MoneyFigure, QueryState, Skeleton, Table, TableNumericCell } from '../../../design-system';
import type { RecentActivityItem } from '../selectors';
import styles from './RecentActivity.module.css';

export interface RecentActivityProps {
  items: RecentActivityItem[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function RecentActivity({ items, isLoading, isError, onRetry }: RecentActivityProps) {
  const isEmpty = !isLoading && !isError && (!items || items.length === 0);

  return (
    <div>
      <div className={styles.header}>
        <div>
          <p className={styles.title}>Atividade recente</p>
          <p className={styles.subtitle}>Últimos lançamentos</p>
        </div>
      </div>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        isEmpty={isEmpty}
        onRetry={onRetry}
        skeleton={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} height="2.5rem" />
            ))}
          </div>
        }
        emptyTitle="Nenhuma transação ainda"
        emptyDescription="Quando você registrar o primeiro gasto ou receita — aqui ou pelo WhatsApp — ele aparece nesta lista."
      >
        <Table caption="Transações recentes">
          <thead>
            <tr>
              <th scope="col">Descrição</th>
              <th scope="col">Categoria</th>
              <th scope="col">Data</th>
              <th scope="col" style={{ textAlign: 'right' }}>
                Valor
              </th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item) => (
              <tr key={item.id}>
                <td>{item.description}</td>
                <td>
                  <Badge tone="neutral">{item.category}</Badge>
                </td>
                <td>{item.date.toLocaleDateString('pt-BR')}</td>
                <TableNumericCell>
                  <MoneyFigure value={item.value} sign={item.type === 'receita' ? 'positive' : 'negative'} size="sm" showSign />
                </TableNumericCell>
              </tr>
            ))}
          </tbody>
        </Table>
      </QueryState>
    </div>
  );
}
