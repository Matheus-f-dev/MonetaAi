// ============================================================================
// Motor da demonstração interativa. Funções puras, sem rede e sem storage:
// o estado vive só na memória da aba e some ao recarregar.
//
// Fidelidade ao produto, de propósito:
//   - interpret() segue o interpretador local do agente
//     (Service/src/agent/AILayer.js, _interpretarLocal / _inferirCategoria /
//     _gerarDescricao): mesmas palavras-chave, mesma ordem, mesmos textos de
//     resposta (sem emoji). Duas correções conscientes, que valem também
//     para o produto: (1) perguntas como "quanto gastei" são checadas ANTES
//     do registro de gasto -- no produto, "gastei" casa primeiro e a pergunta
//     vira "Qual foi o valor do gasto?"; (2) "gás" exige palavra inteira na
//     regra de Moradia (ver CATEGORY_RULES).
//   - as respostas de consulta seguem a formatação do AgentService
//     (_formatarListaGastos, _formatarRelatorio, _formatarSugestoes) e os
//     limites de sugestão do ActionExecutor (Transporte > 20% etc.).
//   - "estourado" segue o BudgetController (gasto > limite).
//   - a saúde financeira é calculada pela MESMA função do app
//     (features/insights/financialHealth.ts).
// ============================================================================

import { calculateHealthScore, type HealthResult } from '../../insights/financialHealth';
import {
  ACCOUNTS,
  BALANCE_BEFORE,
  CATEGORIES_BEFORE,
  EXPENSES_BEFORE,
  GOAL,
  INCOME_TOTAL,
  TX_COUNT_BEFORE,
} from './demo';
import { brl, pct } from '../lib/format';

export type Action = 'registrarGasto' | 'registrarReceita' | 'listarGastos' | 'gerarRelatorio' | 'sugerirEconomia' | 'responderGeral';

export interface Interpretation {
  acao: Action;
  valor: number;
  categoria: string;
  descricao: string;
}

export interface Tx {
  id: number;
  desc: string;
  cat: string;
  value: number; // negativo = despesa
  when: string;
}

export interface Message {
  id: number;
  role: 'user' | 'agent' | 'alert';
  text: string;
  detail?: Array<[string, string]>;
}

export interface Budget {
  categoria: string;
  limite: number;
}

export interface SandboxState {
  balance: number;
  income: number;
  incomeCount: number;
  expenses: number;
  expenseCount: number;
  categories: Record<string, number>;
  budgets: Budget[];
  /** Alerta configurado pela "Bia": categoria + valor limite (como na tela de Alertas). */
  alert: { categoria: string; limite: number; fired: boolean };
  tx: Tx[];
  messages: Message[];
  /** Último efeito, para o painel destacar o que mudou. */
  effect: { kind: Action; categoria?: string; seq: number } | null;
  seq: number;
}

export const DEMO_VALUE_LIMIT = 50000;

export const GREETING =
  'Oi, Bia! Posso registrar gastos e receitas, mostrar o que você gastou, gerar um relatório do mês e sugerir onde economizar.';

export function initialState(): SandboxState {
  const categories: Record<string, number> = {};
  CATEGORIES_BEFORE.forEach((c) => (categories[c.name] = c.value));
  return {
    balance: BALANCE_BEFORE,
    income: INCOME_TOTAL,
    incomeCount: 2,
    expenses: EXPENSES_BEFORE,
    expenseCount: TX_COUNT_BEFORE,
    categories,
    budgets: [
      { categoria: 'Alimentação', limite: 900 },
      { categoria: 'Transporte', limite: 900 },
      { categoria: 'Lazer', limite: 300 },
    ],
    alert: { categoria: 'Lazer', limite: 250, fired: false },
    tx: [
      { id: -1, desc: 'Mercado', cat: 'Alimentação', value: -126.3, when: 'hoje' },
      { id: -2, desc: 'Freela: identidade visual', cat: 'Renda', value: 850, when: 'ontem' },
      { id: -3, desc: 'Cinema', cat: 'Lazer', value: -38, when: 'ontem' },
    ],
    messages: [{ id: 0, role: 'agent', text: GREETING }],
    effect: null,
    seq: 1,
  };
}

// ---------------------------------------------------------------------------
// Interpretação (espelho do interpretador local do produto)
// ---------------------------------------------------------------------------
const CATEGORY_RULES: Array<[RegExp, string]> = [
  [/uber|taxi|táxi|ônibus|onibus|metrô|metro|combustível|combustivel|gasolina|estacionamento/, 'Transporte'],
  [/mercado|supermercado|restaurante|lanche|comida|ifood|delivery|padaria|açougue|hortifruti/, 'Alimentação'],
  [/netflix|spotify|amazon|disney|hbo|streaming|assinatura|prime/, 'Assinaturas'],
  [/farmácia|farmacia|médico|medico|hospital|remédio|remedio|consulta|plano de saúde/, 'Saúde'],
  // Correção: no produto é /...|gás|gas/, sem limite de palavra -- e "gastei"
  // contém "gas", então qualquer gasto de Lazer, Educação ou Vestuário escrito
  // com "gastei" cai em Moradia quando o agente está no modo local.
  [/luz|água|agua|internet|aluguel|condomínio|condominio|gás|gas/, 'Moradia'],
  [/academia|cinema|show|viagem|bar|balada|lazer|jogo|game/, 'Lazer'],
  [/escola|curso|livro|faculdade|universidade|educação|educacao/, 'Educação'],
  [/roupa|sapato|vestuário|vestuario|loja|shopping/, 'Vestuário'],
];

const DESCRIPTION_KEYS: Record<string, string[]> = {
  Transporte: ['uber', 'taxi', 'ônibus', 'metrô', 'combustível', 'gasolina'],
  Alimentação: ['mercado', 'restaurante', 'ifood', 'lanche', 'delivery', 'padaria'],
  Assinaturas: ['netflix', 'spotify', 'amazon', 'disney'],
  Saúde: ['farmácia', 'médico', 'hospital', 'remédio'],
  Moradia: ['aluguel', 'condomínio', 'luz', 'água', 'internet'],
  Lazer: ['academia', 'cinema', 'show', 'viagem'],
  Educação: ['curso', 'escola', 'faculdade', 'livro'],
};

function inferCategory(text: string): string {
  for (const [re, cat] of CATEGORY_RULES) if (re.test(text)) return cat;
  return 'Outros';
}

function describe(text: string, categoria: string): string {
  for (const key of DESCRIPTION_KEYS[categoria] ?? []) {
    if (text.includes(key)) return key.charAt(0).toUpperCase() + key.slice(1);
  }
  return categoria;
}

/** Primeiro valor da frase. Aceita "45", "45,90", "45.90", "1.200,50", "R$ 45". */
export function parseValue(text: string): number {
  const m = text.match(/(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)/);
  if (!m) return 0;
  const raw = m[1];
  const thousands = /^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(raw);
  const normalized = thousands ? raw.replace(/\./g, '').replace(',', '.') : raw.replace(',', '.');
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

export function interpret(message: string): Interpretation {
  const text = message.toLowerCase().trim();
  const valor = parseValue(text);
  const base = { valor, categoria: '', descricao: '' };

  if (/quanto gastei|meus gastos|minhas despesas/.test(text) && valor === 0) {
    return { ...base, acao: 'listarGastos' };
  }
  if (/gastei|paguei|comprei|despesa|saiu|cobrado|debitou/.test(text)) {
    const categoria = inferCategory(text);
    return { acao: 'registrarGasto', valor, categoria, descricao: describe(text, categoria) };
  }
  if (/recebi|salário|salario|entrada|receita|pagamento recebido|caiu na conta|renda/.test(text)) {
    return { acao: 'registrarReceita', valor, categoria: 'Renda', descricao: describe(text, 'Renda') };
  }
  if (/gasto|gastei|histórico|historico|extrato|listar|quanto gastei|minhas despesas/.test(text)) {
    return { ...base, acao: 'listarGastos' };
  }
  if (/relatório|relatorio|resumo|análise|analise|dashboard|balanço|balanco/.test(text)) {
    return { ...base, acao: 'gerarRelatorio' };
  }
  if (/economizar|economia|dica|sugestão|sugestao|cortar|reduzir|poupar/.test(text)) {
    return { ...base, acao: 'sugerirEconomia' };
  }
  return { ...base, acao: 'responderGeral' };
}

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------
const SUGGESTION_LIMITS: Record<string, number> = {
  Alimentação: 0.35,
  Lazer: 0.15,
  Assinaturas: 0.1,
  Transporte: 0.2,
};

const SUGGESTION_TIPS: Record<string, string> = {
  Alimentação: 'Considere cozinhar mais em casa e reduzir pedidos de delivery.',
  Lazer: 'Busque opções de lazer gratuitas ou de baixo custo na sua cidade.',
  Assinaturas: 'Revise suas assinaturas e cancele as que você usa pouco.',
  Transporte: 'Considere usar transporte público ou caronas compartilhadas.',
};

function sortedCategories(state: SandboxState): Array<[string, number]> {
  return Object.entries(state.categories)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/** Aplica uma mensagem do visitante e devolve o novo estado (imutável). */
export function send(state: SandboxState, message: string): SandboxState {
  const text = message.trim().slice(0, 120);
  if (!text) return state;
  let seq = state.seq;
  const messages: Message[] = [...state.messages, { id: seq++, role: 'user', text }];
  const it = interpret(text);
  let next: SandboxState = { ...state, messages, seq };
  const reply = (m: Omit<Message, 'id' | 'role'> & { role?: Message['role'] }) => {
    next.messages = [...next.messages, { id: next.seq, role: m.role ?? 'agent', text: m.text, detail: m.detail }];
    next.seq += 1;
  };

  switch (it.acao) {
    case 'registrarGasto':
    case 'registrarReceita': {
      const isExpense = it.acao === 'registrarGasto';
      if (it.valor <= 0) {
        reply({ text: isExpense ? 'Qual foi o valor do gasto?' : 'Qual foi o valor recebido?' });
        next.effect = null;
        break;
      }
      if (it.valor > DEMO_VALUE_LIMIT) {
        reply({ text: `Nesta demonstração, use valores de até ${brl(DEMO_VALUE_LIMIT)}.` });
        next.effect = null;
        break;
      }
      const tx: Tx = {
        id: next.seq,
        desc: it.descricao,
        cat: it.categoria,
        value: isExpense ? -it.valor : it.valor,
        when: 'agora',
      };
      if (isExpense) {
        const before = next.categories[it.categoria] ?? 0;
        const after = round2(before + it.valor);
        next = {
          ...next,
          balance: round2(next.balance - it.valor),
          expenses: round2(next.expenses + it.valor),
          expenseCount: next.expenseCount + 1,
          categories: { ...next.categories, [it.categoria]: after },
          tx: [tx, ...next.tx].slice(0, 6),
        };
        reply({ text: `Gasto de ${brl(it.valor)} em ${it.categoria} registrado com sucesso.` });
        // Alerta configurado: dispara na virada do limite, como a notificação do produto.
        const a = next.alert;
        if (!a.fired && it.categoria === a.categoria && before <= a.limite && after > a.limite) {
          next.alert = { ...a, fired: true };
          reply({
            role: 'alert',
            text: `Alerta: ${a.categoria} passou de ${brl(a.limite)} este mês (gasto atual: ${brl(after)}). No produto, ele também chega por e-mail.`,
          });
        }
      } else {
        next = {
          ...next,
          balance: round2(next.balance + it.valor),
          income: round2(next.income + it.valor),
          incomeCount: next.incomeCount + 1,
          tx: [tx, ...next.tx].slice(0, 6),
        };
        reply({ text: `Receita de ${brl(it.valor)} registrada com sucesso.` });
      }
      next.effect = { kind: it.acao, categoria: it.categoria, seq: next.seq };
      break;
    }

    case 'listarGastos': {
      const cats = sortedCategories(next);
      reply({
        text: `Seus gastos este mês: ${brl(next.expenses)} em ${next.expenseCount} transações. Por categoria:`,
        detail: cats.map(([c, v]) => [c, `${brl(v)} · ${pct(v, next.expenses)}%`]),
      });
      next.effect = { kind: 'listarGastos', seq: next.seq };
      break;
    }

    case 'gerarRelatorio': {
      const saldo = round2(next.income - next.expenses);
      reply({
        text: 'Relatório financeiro do mês:',
        detail: [
          ['Receitas', brl(next.income)],
          ['Despesas', brl(next.expenses)],
          ['Saldo do mês', brl(saldo)],
          ['Total de transações', String(next.incomeCount + next.expenseCount)],
        ],
      });
      if (saldo < 0) reply({ text: 'Atenção: suas despesas superaram as receitas neste período.' });
      next.effect = { kind: 'gerarRelatorio', seq: next.seq };
      break;
    }

    case 'sugerirEconomia': {
      const total = next.expenses;
      const tips = sortedCategories(next).filter(([c, v]) => SUGGESTION_LIMITS[c] !== undefined && v / total > SUGGESTION_LIMITS[c]);
      if (tips.length === 0) {
        reply({ text: 'Seus gastos estão bem equilibrados! Continue assim e mantenha o controle financeiro.' });
      } else {
        reply({
          text: 'Sugestões de economia personalizadas:',
          detail: tips.map(([c, v]) => [`${c} · ${pct(v, total)}% dos gastos (${brl(v)})`, SUGGESTION_TIPS[c]]),
        });
      }
      next.effect = { kind: 'sugerirEconomia', categoria: tips[0]?.[0], seq: next.seq };
      break;
    }

    default:
      reply({
        text: 'Olá! Sou o Moneta AI. Posso te ajudar a registrar gastos e receitas, ver seu histórico, gerar relatórios e dar dicas de economia. Tente: "gastei 30 na farmácia".',
      });
      next.effect = null;
  }

  return next;
}

// ---------------------------------------------------------------------------
// Indicadores derivados (o painel só lê daqui)
// ---------------------------------------------------------------------------
export interface BudgetView {
  categoria: string;
  gasto: number;
  limite: number;
  percentual: number;
  estourado: boolean;
}

export function budgetViews(state: SandboxState): BudgetView[] {
  return state.budgets.map((b) => {
    const gasto = state.categories[b.categoria] ?? 0;
    return { categoria: b.categoria, gasto, limite: b.limite, percentual: pct(gasto, b.limite), estourado: gasto > b.limite };
  });
}

/** Saúde financeira pela fórmula do produto. */
export function health(state: SandboxState): HealthResult {
  const budgets = budgetViews(state).map((b, i) => ({
    id: String(i),
    userId: 'demo',
    categoria: b.categoria,
    limiteMensal: b.limite,
    ativo: true,
    gastoNoMes: b.gasto,
    percentualUsado: b.percentual,
    estourado: b.estourado,
  }));
  const goalPct = (GOAL.saved / GOAL.target) * 100;
  const goals = [
    {
      id: 'g1',
      userId: 'demo',
      accountId: ACCOUNTS[2].id,
      nome: GOAL.name,
      valorAlvo: GOAL.target,
      prazo: null,
      ativo: true,
      saldoAtual: GOAL.saved,
      percentualAtingido: goalPct,
      concluida: goalPct >= 100,
    },
  ];
  return calculateHealthScore(
    { receitas: state.income, despesas: state.expenses, saldo: state.income - state.expenses },
    budgets,
    goals
  );
}

export function savingRate(state: SandboxState): number {
  return state.income > 0 ? Math.round(((state.income - state.expenses) / state.income) * 100) : 0;
}
