import { type HTMLAttributes } from 'react';
import styles from './Card.module.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Linha perfurada no topo -- usar em cards que mostram um dado
   * "fechado" (um KPI, uma meta, uma conta), não em containers de layout. */
  perforated?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const padClass: Record<NonNullable<CardProps['padding']>, string | undefined> = {
  none: 'padNone',
  sm: 'padSm',
  md: undefined,
  lg: 'padLg'
};

export function Card({ perforated = false, padding = 'md', className, ...rest }: CardProps) {
  const padKey = padClass[padding];
  return (
    <div
      className={[styles.card, perforated && styles.perforated, padKey && styles[padKey], className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    />
  );
}
