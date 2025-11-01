# Componentes do Sistema

Esta pasta contém todos os componentes da página sistema, organizados de forma modular e reutilizável.

## Estrutura dos Componentes

### Componentes Principais
- **Sidebar**: Barra lateral com navegação principal
- **Topbar**: Cabeçalho com saudação e ações
- **Tabs**: Abas de navegação (Visão Geral, Saldo Futuro, Atividades)

### Componentes de Conteúdo
- **KPICards**: Cards com indicadores principais (Saldo, Receitas, Despesas)
- **ChartCard**: Card com gráfico de receitas e despesas
- **SidePanel**: Painel lateral que agrupa ProgressCard e BillsCard
- **ProgressCard**: Card com progresso mensal de gastos
- **BillsCard**: Card com próximas contas a pagar
- **TransactionsTable**: Tabela de transações recentes

### Componentes Auxiliares
- **SideItem**: Item individual da sidebar
- **Icons**: Todos os ícones SVG utilizados no sistema

## Como Usar

```jsx
import { 
  Sidebar, 
  Topbar, 
  Tabs, 
  KPICards, 
  ChartCard, 
  SidePanel, 
  TransactionsTable 
} from '../components/system';

// Uso na página
<div className="sys-layout">
  <Sidebar />
  <main className="sys-main">
    <Topbar userName={userName} />
    <Tabs />
    <section className="sys-panel">
      <KPICards balance={balance} income={income} expenses={expenses} />
      <div className="sys-grid">
        <ChartCard chartData={chartData} chartOptions={chartOptions} />
        <SidePanel progress={progress} salary={salary} bills={bills} />
      </div>
      <TransactionsTable transactions={transactions} />
    </section>
  </main>
</div>
```

## Benefícios da Componentização

1. **Reutilização**: Componentes podem ser reutilizados em outras páginas
2. **Manutenibilidade**: Cada componente tem responsabilidade única
3. **Testabilidade**: Componentes podem ser testados individualmente
4. **Legibilidade**: Código mais limpo e organizado
5. **Escalabilidade**: Fácil adicionar novos componentes ou modificar existentes