// ============================================================================
// Dados de DEMONSTRAÇÃO da landing.
//
// Regras desta pasta:
//  1. Nada aqui é dado real de usuário e nada aqui é métrica de negócio da
//     MonetaAI. É a simulação de UMA conta fictícia, para o produto poder ser
//     mostrado funcionando.
//  2. Os números são internamente coerentes de propósito: o saldo fecha com as
//     contas, a variação do mês fecha com receitas menos despesas, as
//     categorias somam o total de despesas e cada alerta usa o mesmo valor da
//     sua categoria. Um painel de demonstração que não fecha é a primeira
//     coisa que um visitante atento percebe.
//  3. Trocar por dados de outro mês é editar este arquivo e mais nada.
//  4. Nomes de estabelecimento são genéricos, sem marca real.
//
// Fechamento (setembro):
//   9.212,80 (corrente) + 4.480,00 (poupança) - 1.212,45 (cartão) = 12.480,35
//   receitas 8.240,00 - despesas 7.294,55 = 945,45 = 12.480,35 - 11.534,90
// ============================================================================

export const PERIOD = 'Setembro 2026';

export const BALANCE = {
  label: 'Saldo consolidado',
  value: 12480.35,
  previous: 11534.90,
  deltaPct: 8.2,
};

export const MONTH = {
  income: 8240.00,
  expenses: 7294.55,
  free: 945.45,
  expenseAveragePrev5: 7040.00,
};

// Saldo consolidado nos ultimos 12 meses fechados.
export const BALANCE_SERIES = [
  { label: 'out', value: 6120.00 },
  { label: 'nov', value: 6480.00 },
  { label: 'dez', value: 5940.00 },
  { label: 'jan', value: 6820.00 },
  { label: 'fev', value: 7310.00 },
  { label: 'mar', value: 7150.00 },
  { label: 'abr', value: 8240.00 },
  { label: 'mai', value: 8960.00 },
  { label: 'jun', value: 9480.00 },
  { label: 'jul', value: 10310.00 },
  { label: 'ago', value: 11534.90 },
  { label: 'set', value: 12480.35 },
];

// Sparklines de KPI: 12 pontos, hue de de-enfase, sem eixo. Servem para dar
// direcao, nao valor. O valor exato esta no proprio KPI.
export const SPARK_INCOME   = [7480, 7620, 7480, 7900, 8020, 7980, 8120, 8120, 8360, 8560, 8240, 8240];
export const SPARK_EXPENSES = [6240, 6480, 7010, 6820, 6910, 6480, 7150, 7020, 7380, 7020, 7640, 7294.55];
export const SPARK_FREE     = [1240, 1140, 470, 1080, 1110, 1500, 970, 1100, 980, 1540, 600, 945.45];

// Despesas do mes por categoria. Categorias vindas de src/shared/categories.js,
// que e a lista real do produto. Soma = MONTH.expenses.
export const CATEGORIES = [
  { label: 'Moradia',                value: 2150.00, budget: 2200 },
  { label: 'Alimentação',            value: 1486.20, budget: 1400, average3m: 1259.49 },
  { label: 'Transporte',             value:  812.40, budget:  900 },
  { label: 'Educação',               value:  720.00, budget:  720 },
  { label: 'Saúde',                  value:  640.00, budget:  800 },
  { label: 'Outros',                 value:  567.90, budget:  600 },
  { label: 'Lazer',                  value:  528.15, budget:  700 },
  { label: 'Assinaturas e serviços', value:  389.90, budget:  400 },
];

// Receitas x despesas nos ultimos 6 meses. Duas series no mesmo plano, um eixo.
export const FLOW_SERIES = {
  labels: ['abr', 'mai', 'jun', 'jul', 'ago', 'set'],
  income:   [7980.00, 8120.00, 8120.00, 8560.00, 8240.00, 8240.00],
  expenses: [6910.00, 6480.00, 7150.00, 7020.00, 7640.00, 7294.55],
};

// Projecao de saldo futuro. O produto real expoe tres cenarios
// (Service: /api/projecao-saldo), entao a demonstracao expoe tres.
// Ordinal: pessimista < realista < otimista, entao rampa de um hue so.
const project = (monthly, curve) =>
  Array.from({ length: 13 }, (_, month) => ({
    label: month === 0 ? 'hoje' : `+${month}m`,
    value: BALANCE.value + monthly * month + curve * month * month,
  }));

export const SCENARIOS = [
  { id: 'pessimista', label: 'Pessimista', monthly:  520, points: project(520, -4) },
  { id: 'realista',   label: 'Realista',   monthly:  945, points: project(945, 0) },
  { id: 'otimista',   label: 'Otimista',   monthly: 1310, points: project(1310, 8) },
];

export const ACCOUNTS = [
  { label: 'Conta corrente', value:  9212.80, kind: 'conta' },
  { label: 'Poupança',       value:  4480.00, kind: 'conta' },
  { label: 'Cartão •••• 4417',  value: -1212.45, kind: 'cartao', limit: 5000 },
];

export const TRANSACTIONS = [
  { day: 'hoje',   name: 'Supermercado',    category: 'Alimentação',             account: 'Conta corrente', value: -186.40 },
  { day: 'hoje',   name: 'Corrida por app', category: 'Transporte',              account: 'Conta corrente', value:  -18.50 },
  { day: '05 set', name: 'Salário',         category: 'Salário / Provento fixo', account: 'Conta corrente', value: 4200.00 },
  { day: '04 set', name: 'Streaming',       category: 'Assinaturas e serviços',  account: 'Cartão •••• 4417',  value:  -39.90 },
  { day: '03 set', name: 'Farmácia',        category: 'Saúde',                   account: 'Cartão •••• 4417',  value:  -74.80 },
  { day: '02 set', name: 'Aluguel',         category: 'Moradia',                 account: 'Conta corrente', value: -2150.00 },
];

// Orcamento por categoria. Mesmos valores de CATEGORIES, por construcao.
export const BUDGETS = [
  { label: 'Alimentação',            spent: 1486.20, limit: 1400, state: 'over' },
  { label: 'Assinaturas e serviços', spent:  389.90, limit:  400, state: 'near' },
  { label: 'Transporte',             spent:  812.40, limit:  900, state: 'near' },
  { label: 'Lazer',                  spent:  528.15, limit:  700, state: 'ok' },
];

export const GOAL = {
  label: 'Reserva de emergência',
  saved: 4480.00,
  target: 18000.00,
  monthly: 945.45,
};

// A transformacao que e o produto: frase crua virando lancamento resolvido.
// Os tres canais de entrada existem no produto (texto e imagem no bot,
// registro por voz na segunda entrega).
export const CAPTURES = [
  {
    id: 'texto',
    tab: 'Texto',
    hint: 'Mensagem de texto',
    input: 'mercado 186,40 no débito',
    fields: [
      ['Tipo', 'Despesa'],
      ['Categoria', 'Alimentação'],
      ['Conta', 'Conta corrente'],
      ['Valor', 'R$ 186,40'],
    ],
  },
  {
    id: 'foto',
    tab: 'Foto',
    hint: 'Foto da nota fiscal',
    input: 'Nota fiscal, 1 imagem',
    fields: [
      ['Tipo', 'Despesa'],
      ['Categoria', 'Saúde'],
      ['Conta', 'Cartão •••• 4417'],
      ['Valor', 'R$ 74,80'],
    ],
  },
  {
    id: 'voz',
    tab: 'Voz',
    hint: 'Áudio de 4 segundos',
    input: 'paguei o aluguel, dois mil cento e cinquenta',
    fields: [
      ['Tipo', 'Despesa'],
      ['Categoria', 'Moradia'],
      ['Conta', 'Conta corrente'],
      ['Valor', 'R$ 2.150,00'],
    ],
  },
];
