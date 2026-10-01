import type { Balance } from '../dashboard/api';
import type { BudgetStatus, GoalProgress } from '../wealth/api';

export type HealthBand = 'saudavel' | 'em-dia' | 'atencao' | 'critico';

export interface HealthBreakdown {
  label: string;
  score: number;
  weightPercent: number;
  detail: string;
}

export interface HealthResult {
  score: number;
  band: HealthBand;
  bandLabel: string;
  breakdown: HealthBreakdown[];
  tips: string[];
}

const BAND_LABELS: Record<HealthBand, string> = {
  saudavel: 'Saudável',
  'em-dia': 'Em dia',
  atencao: 'Atenção',
  critico: 'Crítico'
};

function bandFor(score: number): HealthBand {
  if (score >= 80) return 'saudavel';
  if (score >= 60) return 'em-dia';
  if (score >= 40) return 'atencao';
  return 'critico';
}

// Mapeia uma taxa (ex.: -0.2 a 0.3) linearmente pra 0-100, saturando nas
// pontas -- em vez de um corte seco em 0%, uma taxa de poupança levemente
// negativa ainda pontua algo (> 0 só a partir de min), e qualquer coisa
// acima de max já é nota máxima.
function scoreFromRate(rate: number, min: number, max: number): number {
  if (rate <= min) return 0;
  if (rate >= max) return 100;
  return ((rate - min) / (max - min)) * 100;
}

/**
 * "Saúde financeira" -- pedido novo (não veio do usuário, é a ideia
 * "fora da caixa" da conversa): um número só que resume receitas x
 * despesas, orçamentos e metas, em vez de a pessoa ter que abrir as 3
 * telas e cruzar na cabeça. Puro client-side -- os 3 dados já existem via
 * useBalanceQuery/useBudgetStatusQuery/useGoalsProgressQuery, nenhuma
 * rota nova no backend.
 *
 * Pesos: 50% taxa de poupança (receita vs despesa do mês -- o fator que
 * mais pesa no dia a dia), 25% orçamentos sob controle, 25% progresso de
 * metas. Quem ainda não configurou orçamento/meta recebe uma nota NEUTRA
 * nesse fator (nem 0 nem 100) -- não é o mesmo que ter orçamento
 * estourado ou meta parada, então não deveria pontuar igual.
 */
export function calculateHealthScore(balance: Balance, budgets: BudgetStatus[], goals: GoalProgress[]): HealthResult {
  const hasIncome = balance.receitas > 0;
  const savingsRate = hasIncome ? (balance.receitas - balance.despesas) / balance.receitas : 0;
  const savingsScore = hasIncome ? scoreFromRate(savingsRate, -0.2, 0.3) : 50;

  const budgetScore = budgets.length > 0 ? (budgets.filter((b) => !b.estourado).length / budgets.length) * 100 : 70;

  const goalScore =
    goals.length > 0 ? goals.reduce((sum, g) => sum + Math.min(100, g.percentualAtingido), 0) / goals.length : 50;

  const score = Math.round(savingsScore * 0.5 + budgetScore * 0.25 + goalScore * 0.25);
  const band = bandFor(score);

  const breakdown: HealthBreakdown[] = [
    {
      label: 'Taxa de poupança',
      score: Math.round(savingsScore),
      weightPercent: 50,
      detail: hasIncome
        ? `${(savingsRate * 100).toFixed(0)}% da renda do mês sobrou`
        : 'Sem receita registrada neste mês'
    },
    {
      label: 'Orçamentos sob controle',
      score: Math.round(budgetScore),
      weightPercent: 25,
      detail:
        budgets.length > 0
          ? `${budgets.filter((b) => !b.estourado).length} de ${budgets.length} categorias dentro do limite`
          : 'Nenhum orçamento configurado ainda'
    },
    {
      label: 'Progresso de metas',
      score: Math.round(goalScore),
      weightPercent: 25,
      detail: goals.length > 0 ? `Média de ${Math.round(goalScore)}% atingido entre ${goals.length} meta(s)` : 'Nenhuma meta cadastrada ainda'
    }
  ];

  const tips: string[] = [];
  if (hasIncome && savingsRate < 0) {
    tips.push('Você gastou mais do que recebeu este mês -- vale revisar os maiores gastos em Análises.');
  } else if (hasIncome && savingsRate < 0.1) {
    tips.push('Sua margem de economia está apertada (menos de 10% da renda) -- um orçamento por categoria ajuda a enxergar onde cortar.');
  }

  if (budgets.length === 0) {
    tips.push('Você ainda não tem orçamento por categoria -- defina um limite mensal em Orçamento pra começar a controlar gastos específicos.');
  } else {
    const estourados = budgets.filter((b) => b.estourado);
    if (estourados.length > 0) {
      tips.push(`${estourados.length} orçamento(s) estourado(s): ${estourados.map((b) => b.categoria).join(', ')}.`);
    }
  }

  if (goals.length === 0) {
    tips.push('Nenhuma meta cadastrada -- criar uma (ex: reserva de emergência) ajuda a dar destino pro que sobra no mês.');
  } else {
    const semProgresso = goals.filter((g) => g.percentualAtingido < 10 && !g.concluida);
    if (semProgresso.length > 0) {
      tips.push(`Suas metas "${semProgresso.map((g) => g.nome).join(', ')}" quase não saíram do papel ainda.`);
    }
  }

  if (tips.length === 0) {
    tips.push('Seus números estão em boa forma -- continue assim!');
  }

  return { score, band, bandLabel: BAND_LABELS[band], breakdown, tips };
}
