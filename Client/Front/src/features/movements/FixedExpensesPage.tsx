import { RecurringItemsPage } from './components/RecurringItemsPage';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function FixedExpensesPage() {
  return (
    <RecurringItemsPage
      kind="expense"
      title="Gastos fixos"
      subtitle={(previsto, pago) => `${brl(previsto)} previstos este mês · ${brl(pago)} já pagos`}
      dayVerb="vence dia"
      dayFieldLabel="Dia de vencimento"
      addLabel="+ Novo gasto fixo"
      emptyDescription="Aluguel, streaming, academia — cadastre uma vez e não precise redigitar todo mês."
    />
  );
}
