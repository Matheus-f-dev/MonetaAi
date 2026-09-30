import ApiConnection from '../../core/services/ApiConnection';

// ApiConnection (Singleton, Service Layer) continua sendo o único ponto
// de chamada HTTP -- os hooks de React Query deste arquivo só decidem
// QUANDO buscar/cachear, nunca COMO chamar a API. `request()` nunca
// lança em resposta HTTP não-2xx (só em falha de rede), então cada
// função aqui confere `success` e lança na mão -- é isso que faz o
// `useQuery`/`useMutation` do TanStack entrar no estado de erro de
// verdade em vez de "suceder" com um payload de erro dentro.
function assertSuccess<T extends { success: boolean; message?: string }>(data: T): T {
  if (!data.success) {
    throw new Error(data.message || 'Erro ao buscar dados.');
  }
  return data;
}

export interface Balance {
  receitas: number;
  despesas: number;
  saldo: number;
}

export async function fetchBalance(userId: string): Promise<Balance> {
  const api = new ApiConnection();
  const data = await api.get(`/api/balance/${userId}`);
  return assertSuccess(data).balance;
}

export interface ChartDataset {
  label: string;
  data: number[];
  borderColor?: string;
  backgroundColor?: string;
  tension?: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export async function fetchChartData(userId: string, filter: string): Promise<ChartData> {
  const api = new ApiConnection();
  const data = await api.get(`/api/chart-data/${userId}?filter=${filter}`);
  return assertSuccess(data).chartData;
}

export interface Transaction {
  id: string;
  tipo: string;
  valor: number;
  descricao: string;
  categoria: string;
  dataHora?: string;
  data?: string;
  criadoEm?: string;
  isTransferencia?: boolean;
  split?: { participantes: Array<{ nome: string; valor: number; pago: boolean }> } | null;
}

export async function fetchTransactions(userId: string): Promise<Transaction[]> {
  const api = new ApiConnection();
  const data = await api.get(`/api/transactions/${userId}`);
  return assertSuccess(data).transactions;
}

export interface UserProfile {
  uid: string;
  nome: string;
  email: string;
  salario: number;
  perfilCompleto: boolean;
  totpAtivo: boolean;
}

export async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const api = new ApiConnection();
  const data = await api.get(`/api/user/${userId}`);
  return assertSuccess(data).user;
}

export interface FixedExpense {
  id: string;
  nome: string;
  valor: number;
  categoria: string;
  diaVencimento: number;
  icone?: string;
  ativo: boolean;
}

export async function fetchFixedExpenses(userId: string): Promise<FixedExpense[]> {
  const api = new ApiConnection();
  const data = await api.get(`/api/fixed-expenses/${userId}`);
  return assertSuccess(data).fixedExpenses ?? [];
}

export interface ProjectionPoint {
  month: number;
  balance: number;
}

export interface ProjectionResult {
  saldoAtual: number;
  tendencia: 'crescendo' | 'decaindo' | 'estável';
  cenarios: {
    optimistic: ProjectionPoint[];
    realistic: ProjectionPoint[];
    pessimistic: ProjectionPoint[];
  };
}

export async function fetchProjection(meses: number, transactions: Transaction[]): Promise<ProjectionResult> {
  const api = new ApiConnection();
  // Esta rota não segue o padrão {success, ...} do resto da API (devolve
  // o resultado direto) -- preservado como já era no FutureBalance.jsx
  // antigo, não é escopo desta fase mudar contrato de backend.
  const data = await api.post(`/api/projecao-saldo/${meses}`, { transactions });
  if (!data || !data.cenarios) {
    throw new Error('Erro ao calcular projeção de saldo.');
  }
  return data;
}
