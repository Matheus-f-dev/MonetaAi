import { type ReactNode } from 'react';
import { Button } from './Button';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** "empty" (usuário novo, nada cadastrado ainda) ou "error" (a busca
   * falhou -- sempre com ação de tentar de novo, nunca só um texto morto). */
  tone?: 'empty' | 'error';
}

/**
 * Cobre os dois estados "não populado" que toda tela que busca dado da
 * API precisa tratar como caso central (ver Fase 0): o usuário
 * recém-cadastrado sem nada ainda, e a falha de rede/API. Nunca renderize
 * uma tela em branco nem um "undefined" no lugar de conteúdo -- se não
 * tem dado, é sempre por um destes dois motivos, e cada um pede uma
 * mensagem e uma ação diferentes.
 */
export function EmptyState({ icon, title, description, actionLabel, onAction, tone = 'empty' }: EmptyStateProps) {
  return (
    <div className={styles.wrap} data-tone={tone} role={tone === 'error' ? 'alert' : undefined}>
      {icon && <span className={styles.icon}>{icon}</span>}
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
      {actionLabel && onAction && (
        <div className={styles.action}>
          <Button variant={tone === 'error' ? 'secondary' : 'primary'} size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
