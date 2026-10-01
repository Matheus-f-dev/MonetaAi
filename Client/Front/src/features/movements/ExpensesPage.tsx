import { TransactionsListPage } from './components/TransactionsListPage';

export default function ExpensesPage() {
  return (
    <TransactionsListPage
      tipo="despesa"
      title="Gastos"
      subtitle="Todas as suas despesas registradas"
      emptyDescription="Registre um gasto — aqui ou pelo WhatsApp — pra começar a acompanhar pra onde seu dinheiro está indo."
    />
  );
}
