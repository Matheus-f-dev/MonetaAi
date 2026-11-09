const brlFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const brlRound = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

/** "R$ 4.812,40". Espaço normal no lugar do NBSP do Intl, pra quebrar igual em todo navegador. */
export function brl(value: number): string {
  return brlFormatter.format(value).replace(/ /g, ' ');
}

/** "R$ 4.812" -- para eixos, rótulos curtos e números de manchete. */
export function brl0(value: number): string {
  return brlRound.format(value).replace(/ /g, ' ');
}

/** Valor com sinal explícito: "+ R$ 850,00" / "− R$ 45,00". */
export function signedBrl(value: number): string {
  return `${value < 0 ? '−' : '+'} ${brl(Math.abs(value))}`;
}

export function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

/** Smoothstep 0-1: entra e sai devagar, sem o tranco do linear. */
export function ease(n: number): number {
  const t = clamp01(n);
  return t * t * (3 - 2 * t);
}

/** Remapeia n do intervalo [a, b] para [0, 1], saturando nas pontas. */
export function range(n: number, a: number, b: number): number {
  return clamp01((n - a) / (b - a));
}
