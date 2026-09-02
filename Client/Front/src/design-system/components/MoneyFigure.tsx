import styles from './MoneyFigure.module.css';

export type MoneyFigureSign = 'auto' | 'positive' | 'negative' | 'neutral';
export type MoneyFigureSize = 'sm' | 'md' | 'lg' | 'xl';

export interface MoneyFigureProps {
  /** Valor em reais. Negativo é tratado como despesa quando sign="auto". */
  value: number;
  /**
   * "auto" decide a cor pelo sinal do valor -- é o padrão certo pra saldo
   * (positivo/negativo tem significado real). Force "neutral" pra um valor
   * que é sempre positivo mas não deve carregar peso de "receita" (ex.:
   * limite de orçamento, valor de uma meta).
   */
  sign?: MoneyFigureSign;
  size?: MoneyFigureSize;
  /** Antepõe +/- explícito (bom em listas de transação, onde a linha
   * inteira já é vermelha ou verde e o sinal reforça sem precisar de ícone). */
  showSign?: boolean;
  className?: string;
}

const formatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

/**
 * O elemento assinatura do design system -- todo valor monetário do
 * Moneta passa por aqui. Fonte monoespaçada com algarismos tabulares
 * (JetBrains Mono) em vez da fonte de corpo: é o que faz o produto
 * parecer um extrato/livro-razão em vez de "só mais um card de SaaS".
 * Nunca formate um valor em R$ direto num <span> fora deste componente.
 */
export function MoneyFigure({ value, sign = 'auto', size = 'md', showSign = false, className }: MoneyFigureProps) {
  const resolvedSign = sign === 'auto' ? (value < 0 ? 'negative' : value > 0 ? 'positive' : 'neutral') : sign;
  const absValue = Math.abs(value);
  const signChar = value < 0 ? '−' : '+';

  return (
    <span
      className={[styles.figure, styles[resolvedSign], styles[size], className].filter(Boolean).join(' ')}
      aria-label={`${value < 0 ? 'menos' : 'mais'} ${formatter.format(absValue)} reais`}
    >
      {showSign && <span className={styles.sign}>{signChar}</span>}
      <span className={styles.currency}>R$</span>
      {formatter.format(absValue)}
    </span>
  );
}
