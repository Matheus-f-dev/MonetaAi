import { type ReactNode } from 'react';
import { EmptyState } from './EmptyState';

export interface QueryStateProps {
  isLoading: boolean;
  isError: boolean;
  isEmpty?: boolean;
  onRetry?: () => void;
  skeleton: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  errorTitle?: string;
  children: ReactNode;
}

/**
 * Despacha os 4 estados que toda seção alimentada por dado da API precisa
 * tratar (Fase 0) -- loading/erro/vazio/populado -- num só lugar, pra
 * cada tela nova não reimplementar o mesmo `if/else if/else` cinco vezes.
 * `isEmpty` é opcional: nem toda seção tem um conceito de "vazio"
 * diferente de "populado com zero itens" (ex.: um KPI sempre tem valor,
 * mesmo que R$ 0,00).
 */
export function QueryState({
  isLoading,
  isError,
  isEmpty = false,
  onRetry,
  skeleton,
  emptyTitle = 'Nada por aqui ainda',
  emptyDescription,
  emptyIcon,
  errorTitle = 'Não foi possível carregar',
  children
}: QueryStateProps) {
  if (isLoading) return <>{skeleton}</>;

  if (isError) {
    return (
      <EmptyState
        tone="error"
        icon={emptyIcon}
        title={errorTitle}
        description="A conexão com o servidor falhou. Seus dados estão salvos — é só tentar de novo."
        actionLabel={onRetry ? 'Tentar de novo' : undefined}
        onAction={onRetry}
      />
    );
  }

  if (isEmpty) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />;
  }

  return <>{children}</>;
}
