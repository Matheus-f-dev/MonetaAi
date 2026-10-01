import type { Investment } from './api';

function monthsBetween(start: Date, end: Date): number {
  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) months -= 1;
  return Math.max(0, months);
}

// Valor futuro de um aporte inicial + aportes mensais constantes (série
// uniforme postecipada -- aporte no fim de cada mês), juros compostos.
function valorFuturo(valorInicial: number, aporteMensal: number, taxaMensal: number, meses: number): number {
  const crescimentoInicial = valorInicial * Math.pow(1 + taxaMensal, meses);
  if (taxaMensal === 0) return crescimentoInicial + aporteMensal * meses;
  const anuidade = aporteMensal * ((Math.pow(1 + taxaMensal, meses) - 1) / taxaMensal);
  return crescimentoInicial + anuidade;
}

export interface PortfolioProjection {
  /** Meses a partir de hoje (0 = hoje). */
  months: number[];
  /** Soma do que foi/será de fato colocado do próprio bolso, sem considerar rendimento. */
  aportado: number[];
  /** Soma projetada com juros compostos aplicados. */
  projetado: number[];
}

/**
 * Projeta o valor agregado da carteira (todos os investimentos ativos)
 * daqui a `horizonMonths` meses, à taxa de retorno anual cadastrada em
 * cada investimento. Primeiro traz cada investimento pro valor atual
 * (considerando o que já rendeu/aportou desde `dataInicio` até hoje),
 * depois projeta esse valor atual pra frente -- tudo puro client-side,
 * o backend só guarda os parâmetros, nunca calcula isso.
 */
export function projectPortfolio(investments: Investment[], horizonMonths: number, sampleCount = 48): PortfolioProjection {
  const today = new Date();
  const step = Math.max(1, Math.round(horizonMonths / sampleCount));
  const months: number[] = [];
  for (let m = 0; m < horizonMonths; m += step) months.push(m);
  if (months[months.length - 1] !== horizonMonths) months.push(horizonMonths);

  const aportado = months.map(() => 0);
  const projetado = months.map(() => 0);

  for (const inv of investments) {
    const taxaMensal = Math.pow(1 + inv.taxaRetornoAnual / 100, 1 / 12) - 1;
    const aporteMensal = inv.tipoAporte === 'mensal' ? inv.aporteMensal : 0;
    const elapsed = monthsBetween(new Date(inv.dataInicio), today);

    const valorAtual = valorFuturo(inv.valorInicial, aporteMensal, taxaMensal, elapsed);
    const aportadoAteAgora = inv.valorInicial + aporteMensal * elapsed;

    months.forEach((m, idx) => {
      projetado[idx] += valorFuturo(valorAtual, aporteMensal, taxaMensal, m);
      aportado[idx] += aportadoAteAgora + aporteMensal * m;
    });
  }

  return { months, aportado, projetado };
}

export const HORIZON_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 12, label: '1 ano' },
  { value: 60, label: '5 anos' },
  { value: 120, label: '10 anos' },
  { value: 240, label: '20 anos' },
  { value: 360, label: '30 anos' }
];
