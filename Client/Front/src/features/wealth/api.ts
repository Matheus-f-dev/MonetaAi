import ApiConnection from '../../core/services/ApiConnection';

function assertSuccess<T extends { success: boolean; message?: string }>(data: T): T {
  if (!data.success) {
    throw new Error(data.message || 'Erro ao buscar dados.');
  }
  return data;
}

// ── Contas ──────────────────────────────────────────────────────────
export interface Account {
  id: string;
  userId: string;
  nome: string;
  tipo: string;
  saldoInicial: number;
  instituicao: string | null;
  cor: string;
  liquidez: boolean;
  principal: boolean;
  ativo: boolean;
  saldoAtual: number;
}

export interface AccountResumo {
  saldoTotal: number;
  saldoDisponivel: number;
  saldoComprometido: number;
  saldoPrevisto: number;
  limiteCreditoDisponivel: number;
  detalhes: { comprometidoCartoes: number; comprometidoFixos: number };
}

export interface AccountInput {
  nome: string;
  tipo: string;
  saldoInicial: number;
  instituicao?: string;
  cor?: string;
}

export async function fetchAccounts(userId: string): Promise<Account[]> {
  const api = new ApiConnection();
  const data = assertSuccess(await api.get(`/api/accounts/${userId}`));
  return data.accounts ?? [];
}

export async function fetchAccountResumo(userId: string): Promise<AccountResumo> {
  const api = new ApiConnection();
  const data = assertSuccess(await api.get(`/api/accounts/${userId}/resumo`));
  return data.resumo;
}

export async function createAccount(input: AccountInput) {
  const api = new ApiConnection();
  return assertSuccess(await api.post('/api/accounts', input));
}

export async function updateAccount(id: string, input: AccountInput) {
  const api = new ApiConnection();
  return assertSuccess(await api.put(`/api/accounts/${id}`, input));
}

export async function deleteAccount(id: string) {
  const api = new ApiConnection();
  return assertSuccess(await api.delete(`/api/accounts/${id}`));
}

export interface TransferInput {
  fromAccountId: string;
  toAccountId: string;
  valor: number;
  descricao?: string;
}

export async function transferBetweenAccounts(userId: string, input: TransferInput) {
  const api = new ApiConnection();
  const idempotencyKey = crypto.randomUUID();
  return assertSuccess(await api.post(`/api/accounts/${userId}/transfer`, { ...input, idempotencyKey }));
}

export interface Reconciliation {
  id: string;
  accountId: string;
  saldoInformado: number;
  saldoCalculado: number;
  diferenca: number;
  criadoEm?: string;
  bate?: boolean;
}

export async function reconcileAccount(userId: string, accountId: string, saldoInformado: number): Promise<Reconciliation> {
  const api = new ApiConnection();
  const data = assertSuccess(await api.post(`/api/accounts/${userId}/${accountId}/reconciliar`, { saldoInformado }));
  return data.reconciliation;
}

export async function fetchReconciliationHistory(userId: string, accountId: string): Promise<Reconciliation[]> {
  const api = new ApiConnection();
  const data = assertSuccess(await api.get(`/api/accounts/${userId}/${accountId}/reconciliations`));
  return data.reconciliations ?? [];
}

// ── Cartões ─────────────────────────────────────────────────────────
export interface CardItem {
  id: string;
  userId: string;
  nome: string;
  instituicao: string | null;
  final: string;
  limite: number;
  diaFechamento: number;
  diaVencimento: number;
  cor: string;
  ativo: boolean;
}

export interface CardInvoice {
  total: number;
  limite: number;
  usoPercentual: number;
  diaFechamento: number;
  diaVencimento: number;
}

export interface CardInput {
  nome: string;
  instituicao?: string;
  final: string;
  limite?: number;
  diaFechamento: number;
  diaVencimento: number;
  cor?: string;
}

export async function fetchCards(userId: string): Promise<CardItem[]> {
  const api = new ApiConnection();
  const data = assertSuccess(await api.get(`/api/cards/${userId}`));
  return data.cards ?? [];
}

export async function fetchCardInvoice(userId: string, cardId: string): Promise<CardInvoice> {
  const api = new ApiConnection();
  const data = assertSuccess(await api.get(`/api/cards/${userId}/${cardId}/invoice`));
  return data.invoice;
}

export async function createCard(input: CardInput) {
  const api = new ApiConnection();
  return assertSuccess(await api.post('/api/cards', input));
}

export async function updateCard(id: string, input: CardInput) {
  const api = new ApiConnection();
  return assertSuccess(await api.put(`/api/cards/${id}`, input));
}

export async function deleteCard(id: string) {
  const api = new ApiConnection();
  return assertSuccess(await api.delete(`/api/cards/${id}`));
}

// ── Orçamento por categoria ─────────────────────────────────────────
export interface Budget {
  id: string;
  userId: string;
  categoria: string;
  limiteMensal: number;
  ativo: boolean;
}

export interface BudgetStatus extends Budget {
  gastoNoMes: number;
  percentualUsado: number;
  estourado: boolean;
}

export interface BudgetInput {
  categoria: string;
  limiteMensal: number;
}

export async function fetchBudgetStatus(userId: string): Promise<BudgetStatus[]> {
  const api = new ApiConnection();
  const data = assertSuccess(await api.get(`/api/budgets/${userId}/status`));
  return data.status ?? [];
}

export async function createBudget(input: BudgetInput) {
  const api = new ApiConnection();
  return assertSuccess(await api.post('/api/budgets', input));
}

export async function updateBudget(id: string, input: BudgetInput) {
  const api = new ApiConnection();
  return assertSuccess(await api.put(`/api/budgets/${id}`, input));
}

export async function deleteBudget(id: string) {
  const api = new ApiConnection();
  return assertSuccess(await api.delete(`/api/budgets/${id}`));
}

// ── Metas financeiras ───────────────────────────────────────────────
export interface Goal {
  id: string;
  userId: string;
  accountId: string | null;
  nome: string;
  valorAlvo: number;
  prazo: string | null;
  ativo: boolean;
}

export interface GoalProgress extends Goal {
  saldoAtual: number;
  percentualAtingido: number;
  concluida: boolean;
}

export interface GoalInput {
  nome: string;
  valorAlvo: number;
  prazo?: string;
  accountId?: string;
}

export async function fetchGoalProgress(userId: string): Promise<GoalProgress[]> {
  const api = new ApiConnection();
  const data = assertSuccess(await api.get(`/api/goals/${userId}/progress`));
  return data.progresso ?? [];
}

export async function createGoal(input: GoalInput) {
  const api = new ApiConnection();
  return assertSuccess(await api.post('/api/goals', input));
}

export async function updateGoal(id: string, input: GoalInput) {
  const api = new ApiConnection();
  return assertSuccess(await api.put(`/api/goals/${id}`, input));
}

export async function deleteGoal(id: string) {
  const api = new ApiConnection();
  return assertSuccess(await api.delete(`/api/goals/${id}`));
}

// ── Investimentos ───────────────────────────────────────────────────
export type TipoAporte = 'unico' | 'mensal';
// 'acao'/'fii'/'cripto' são ativos de MERCADO -- valor vem de
// quantidade × cotação ao vivo (ver fetchMarketQuote), não de
// valorInicial/aporteMensal/taxaRetornoAnual digitados à mão.
export type TipoAtivo = 'renda_fixa' | 'acao' | 'fii' | 'cripto' | 'imovel' | 'outro';

export interface Investment {
  id: string;
  userId: string;
  nome: string;
  categoria: string;
  tipoAtivo: TipoAtivo;
  /** Código da ação na B3 (ex.: "PETR4") ou id da moeda no CoinGecko
   * (ex.: "bitcoin") -- só preenchido pra tipoAtivo de mercado. */
  ticker: string | null;
  /** Unidades/cotas/moedas que a pessoa tem -- só pra tipoAtivo de mercado. */
  quantidade: number | null;
  tipoAporte: TipoAporte;
  valorInicial: number;
  aporteMensal: number;
  /** % ao ano (ex.: 8.5 = 8,5% ao ano) -- a projeção converte pra taxa
   * mensal equivalente na hora de desenhar o gráfico (ver
   * InvestimentosPage -> projetar()). */
  taxaRetornoAnual: number;
  dataInicio: string;
  ativo: boolean;
}

export interface InvestmentInput {
  nome: string;
  categoria: string;
  tipoAtivo: TipoAtivo;
  ticker?: string;
  quantidade?: number;
  tipoAporte: TipoAporte;
  valorInicial: number;
  aporteMensal: number;
  taxaRetornoAnual: number;
  dataInicio: string;
}

export interface MarketQuote {
  nome: string;
  preco: number;
  variacaoPercentual: number;
  moeda: string;
  atualizadoEm: string;
}

export async function fetchMarketQuote(tipoAtivo: 'acao' | 'fii' | 'cripto', ticker: string): Promise<MarketQuote> {
  const api = new ApiConnection();
  const data = assertSuccess(await api.get(`/api/market/quote?tipo=${tipoAtivo}&ticker=${encodeURIComponent(ticker)}`));
  return data.cotacao;
}

export async function fetchInvestments(userId: string): Promise<Investment[]> {
  const api = new ApiConnection();
  const data = assertSuccess(await api.get(`/api/investments/${userId}`));
  return data.investments ?? [];
}

export async function createInvestment(input: InvestmentInput) {
  const api = new ApiConnection();
  return assertSuccess(await api.post('/api/investments', input));
}

export async function updateInvestment(id: string, input: InvestmentInput) {
  const api = new ApiConnection();
  return assertSuccess(await api.put(`/api/investments/${id}`, input));
}

export async function deleteInvestment(id: string) {
  const api = new ApiConnection();
  return assertSuccess(await api.delete(`/api/investments/${id}`));
}
