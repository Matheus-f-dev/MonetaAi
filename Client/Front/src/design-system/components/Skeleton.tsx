import styles from './Skeleton.module.css';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  /** Formato circular -- avatar, ícone de status. */
  circle?: boolean;
}

/**
 * Skeleton de verdade (formato do dado real), nunca um spinner genérico --
 * ver o critério de "todo estado importa" no resumo da Fase 0. Cada tela
 * compõe vários <Skeleton> no layout exato do conteúdo que vai substituir.
 */
export function Skeleton({ width = '100%', height = '1rem', className, circle = false }: SkeletonProps) {
  return (
    <span
      className={[styles.skeleton, className].filter(Boolean).join(' ')}
      style={{ width, height, borderRadius: circle ? '50%' : undefined, display: 'block' }}
      aria-hidden="true"
    />
  );
}
