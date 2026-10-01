import { TransactionsListPage } from './components/TransactionsListPage';

export default function IncomesPage() {
  return (
    <TransactionsListPage
      tipo="receita"
      title="Receitas"
      subtitle="Todas as suas receitas registradas"
      emptyDescription="Registre seu salário ou uma renda extra — aqui ou pelo WhatsApp — pra começar a acompanhar suas entradas."
    />
  );
}
