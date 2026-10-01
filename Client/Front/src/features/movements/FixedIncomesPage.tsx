import { RecurringItemsPage } from './components/RecurringItemsPage';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function FixedIncomesPage() {
  return (
    <RecurringItemsPage
      kind="income"
      title="Receita recorrente"
      subtitle={(previsto, pago) => `${brl(previsto)} previstos este mês · ${brl(pago)} já recebidos`}
      dayVerb="recebe dia"
      dayFieldLabel="Dia de recebimento"
      addLabel="+ Nova receita recorrente"
      emptyDescription="Salário, aluguel recebido, mesada — cadastre uma vez e acompanhe todo mês sem lançar na mão."
    />
  );
}
