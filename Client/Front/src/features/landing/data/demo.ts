// ============================================================================
// Dados de demonstração da landing.
//
// Fictícios, mas coerentes entre si: é o MESMO mês de uma mesma pessoa que
// aparece no painel, na conversa com o agente, nas análises e nas metas. Toda
// soma abaixo fecha com as suas parcelas (as contas estão nos comentários) e
// toda regra segue o comportamento real do produto:
//   - progresso de meta = saldo da conta vinculada (GoalController.getProgress)
//   - impacto de compra = % da renda média e meses para juntar no ritmo atual
//     de economia (ImpactoFinanceiroService)
//   - sugestão de economia = categorias acima do limite de referência do
//     agente (ActionExecutor._gerarSugestoes: Transporte > 20%)
// Mudou um número aqui, confira os que dependem dele.
// ============================================================================

export const MONTH_LABEL = 'Outubro de 2026';

// Contas. Soma = 2172,40 + 180,00 + 2460,00 = 4812,40
export const ACCOUNTS = [
  { id: 'corrente', name: 'Conta corrente', detail: 'Banco digital', balance: 2172.4 },
  { id: 'carteira', name: 'Carteira', detail: 'Dinheiro', balance: 180 },
  { id: 'intercambio', name: 'Poupança Intercâmbio', detail: 'Vinculada à meta', balance: 2460 },
] as const;

export const BALANCE_BEFORE = 4812.4;
export const UBER = 45;
export const BALANCE_AFTER = BALANCE_BEFORE - UBER; // 4767,40

// Receitas do mês: 2400 + 1550 = 3950
export const INCOME_TOTAL = 3950;
export const INCOME_ITEMS = [
  { name: 'Estágio', value: 2400 },
  { name: 'Freelas de design', value: 1550 },
] as const;

// Despesas do mês ANTES do Uber registrado pelo agente.
// 1050 + 685,40 + 513 + 214,50 + 150 + 98,70 = 2711,60
export interface Category {
  name: string;
  value: number;
}

export const CATEGORIES_BEFORE: Category[] = [
  { name: 'Moradia', value: 1050 },
  { name: 'Alimentação', value: 685.4 },
  { name: 'Transporte', value: 513 },
  { name: 'Lazer', value: 214.5 },
  { name: 'Saúde', value: 150 },
  { name: 'Assinaturas', value: 98.7 },
];

export const EXPENSES_BEFORE = 2711.6;
export const EXPENSES_AFTER = EXPENSES_BEFORE + UBER; // 2756,60
export const CATEGORIES_AFTER: Category[] = CATEGORIES_BEFORE.map((c) =>
  c.name === 'Transporte' ? { ...c, value: c.value + UBER } : c
);
export const TX_COUNT_BEFORE = 23;
export const TX_COUNT_AFTER = TX_COUNT_BEFORE + 1;

// Economia do mês: (3950 - 2711,60) / 3950 = 31,4%
export const SAVING_RATE = Math.round(((INCOME_TOTAL - EXPENSES_BEFORE) / INCOME_TOTAL) * 100);

// Orçamentos. Transporte: 513/900 = 57% -> 558/900 = 62% depois do Uber.
export const BUDGETS = [
  { category: 'Alimentação', spent: 685.4, limit: 900 }, // 76%
  { category: 'Transporte', spent: 513, limit: 900 }, // 57%
  { category: 'Lazer', spent: 214.5, limit: 300 }, // 72%
] as const;

export const TRANSPORT_LIMIT = 900;
export const TRANSPORT_BEFORE = 513;
export const TRANSPORT_AFTER = TRANSPORT_BEFORE + UBER;

// Meta vinculada à Poupança Intercâmbio: 2460 / 6000 = 41%
export const GOAL = {
  name: 'Intercâmbio',
  target: 6000,
  saved: 2460,
  account: 'Poupança Intercâmbio',
  deadline: 'jul. 2027',
} as const;

// Contas a pagar nos próximos dias (ainda não entram nas despesas do mês).
export const UPCOMING = [
  { name: 'Internet', day: 20, value: 99.9 },
  { name: 'Fatura do cartão', day: 25, value: 642.8 },
  { name: 'Academia', day: 28, value: 89.9 },
] as const;

export const CARD = { invoice: 642.8, closes: 18, due: 25, limit: 2500 } as const; // 26% do limite

// Saldo no fim de cada mês (outubro = hoje).
export const BALANCE_HISTORY = [
  { m: 'mai', v: 2140 },
  { m: 'jun', v: 2610 },
  { m: 'jul', v: 2980 },
  { m: 'ago', v: 3420 },
  { m: 'set', v: 4050 },
  { m: 'out', v: BALANCE_BEFORE },
] as const;

// Despesas por mês. Média mai-set = 14710 / 5 = 2942.
// Outubro (com o Uber) = 2756,60 -> 185,40 abaixo da média.
export const EXPENSE_HISTORY = [
  { m: 'mai', v: 2980 },
  { m: 'jun', v: 2840 },
  { m: 'jul', v: 3050 },
  { m: 'ago', v: 2910 },
  { m: 'set', v: 2930 },
  { m: 'out', v: EXPENSES_AFTER },
] as const;
export const EXPENSE_AVG = 2942;
export const BELOW_AVG = Math.round(EXPENSE_AVG - EXPENSES_AFTER); // 185

export const RECENT = [
  { desc: 'Mercado', cat: 'Alimentação', value: -126.3, when: 'Hoje' },
  { desc: 'Freela: identidade visual', cat: 'Renda', value: 850, when: 'Ontem' },
  { desc: 'Cinema', cat: 'Lazer', value: -38, when: 'Ontem' },
  { desc: 'Farmácia', cat: 'Saúde', value: -42.9, when: '14 out' },
] as const;

// Projeção em três cenários a partir do saldo de hoje (4767,40).
// abr/2027: 4767,40 + 6 x 380 / 700 / 950 = 7047,40 · 8967,40 · 10467,40
export const PROJECTION = {
  start: BALANCE_AFTER,
  months: ['hoje', 'nov', 'dez', 'jan', 'fev', 'mar', 'abr'],
  monthly: { pessimista: 380, realista: 700, otimista: 950 },
} as const;

// Impacto de compra. Renda média 3950, despesa média 2942 -> economia 1008.
// 2400 / 3950 = 61% da renda · ceil(2400 / 1008) = 3 meses para juntar.
export const IMPACT = {
  item: 'Notebook',
  value: 2400,
  incomePct: 61,
  monthsToSave: 3,
} as const;

// Saúde financeira: não é número fixo -- sai da função do app
// (features/insights/financialHealth.ts) via data/sandbox.ts.

// Rachadinha: 128 / 4 = 32 por pessoa; 3 amigos devem, 2 já pagaram.
export const SPLIT = {
  title: 'Pizza de sexta',
  total: 128,
  each: 32,
  people: [
    { name: 'Rafa', paid: true },
    { name: 'Duda', paid: true },
    { name: 'Theo', paid: false },
  ],
} as const;

// Calendário: outubro de 2026 começa numa quinta-feira; "hoje" é dia 16.
export const CALENDAR = {
  year: 2026,
  month: 9, // 0-based, outubro
  today: 16,
  paid: [5, 5, 12], // aluguel, estágio (receita), assinaturas
  due: UPCOMING.map((u) => u.day),
} as const;

export const RECURRING = [
  { name: 'Aluguel', day: 5, value: -1050, status: 'Lançado' },
  { name: 'Estágio', day: 5, value: 2400, status: 'Lançado' },
  { name: 'Spotify', day: 12, value: -21.9, status: 'Lançado' },
  { name: 'Academia', day: 28, value: -89.9, status: 'Lançar' },
] as const;
