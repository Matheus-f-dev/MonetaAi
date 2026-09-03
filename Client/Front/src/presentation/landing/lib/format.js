// Formatação de dinheiro e número. Um lugar só, porque um valor exibido de
// dois jeitos diferentes na mesma página é o tipo de detalhe que faz um
// produto financeiro parecer amador.

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const BRL_ROUND = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const NUM = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** R$ 12.480,35 */
export const brl = (value) => BRL.format(value ?? 0);

/** R$ 12.480 — para tick de eixo e rótulo compacto, onde centavo é ruído. */
export const brlShort = (value) => BRL_ROUND.format(value ?? 0);

/** 12.480 */
export const num = (value) => NUM.format(value ?? 0);

/** R$ 12,5 mil — só em tick de eixo, onde o valor exato vive na tabela. */
export function brlAxis(value) {
  const v = value ?? 0;
  if (Math.abs(v) >= 1000) {
    const k = v / 1000;
    const s = k.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: Math.abs(k) < 10 ? 1 : 0,
    });
    return `${s} mil`;
  }
  return NUM.format(v);
}

/** +8,2% / -4,8% — sempre com sinal, porque a direção é o dado. */
export function signedPct(value, digits = 1) {
  const v = value ?? 0;
  const s = Math.abs(v).toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return `${v >= 0 ? '+' : '-'}${s}%`;
}

/** 90% */
export const pct = (value) => `${Math.round(value ?? 0)}%`;
