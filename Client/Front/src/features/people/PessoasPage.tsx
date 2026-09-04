import { useMemo, useState } from 'react';
import { Badge, EmptyState, Input, MoneyFigure, QueryState, Skeleton } from '../../design-system';
import { useToast } from '../../presentation/hooks/useToast';
import type { Person, SplitItem } from './api';
import { useCurrentUserId, usePeopleQuery, useSetParticipantPaidMutation } from './queries';
import styles from './PessoasPage.module.css';

/**
 * Fase 5 -- reconstrução de /pessoas dentro do AppShell. Mesmo contrato
 * de backend da tela antiga (agregado por pessoa a partir dos splits de
 * despesa já lançados em Gastos, ver Fase 3 -> TransactionModal). Não
 * cria split daqui -- só acompanha quem deve o quê e marca como pago.
 */
export default function PessoasPage() {
  const userId = useCurrentUserId();
  const { addToast } = useToast();

  const peopleQuery = usePeopleQuery(userId);
  const toggleMutation = useSetParticipantPaidMutation();

  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const people = peopleQuery.data ?? [];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return people;
    return people.filter((p) => p.nome.toLowerCase().includes(term));
  }, [people, search]);

  const totals = useMemo(
    () => ({
      devido: people.reduce((sum, p) => sum + p.totalDevido, 0),
      pago: people.reduce((sum, p) => sum + p.totalPago, 0)
    }),
    [people]
  );

  async function handleToggle(item: SplitItem) {
    try {
      await toggleMutation.mutateAsync({ transactionId: item.transactionId, participantIndex: item.participantIndex, pago: !item.pago });
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao atualizar pagamento', 'error');
    }
  }

  const isEmpty = !peopleQuery.isLoading && !peopleQuery.isError && people.length === 0;
  const hasSearchMiss = !isEmpty && filtered.length === 0 && search.trim() !== '';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Pessoas</h1>
          <p className={styles.subtitle}>
            {people.length > 0 ? (
              <>
                <MoneyFigure value={totals.devido} sign="neutral" size="sm" /> a receber ·{' '}
                <MoneyFigure value={totals.pago} sign="neutral" size="sm" /> já recebido em despesas divididas
              </>
            ) : (
              'Quem te deve e quem já pagou em despesas divididas'
            )}
          </p>
        </div>
      </div>

      {!isEmpty && (
        <div className={styles.searchField}>
          <Input label="Buscar" placeholder="Buscar pessoa pelo nome..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      )}

      <QueryState
        isLoading={peopleQuery.isLoading}
        isError={peopleQuery.isError}
        isEmpty={isEmpty}
        onRetry={peopleQuery.refetch}
        skeleton={
          <div className={styles.list}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height="4.5rem" />
            ))}
          </div>
        }
        emptyTitle="Nenhuma despesa dividida ainda"
        emptyDescription='Ao lançar um gasto em Gastos, marque "Dividir com outras pessoas" pra começar a rastrear quem te deve.'
      >
        {hasSearchMiss ? (
          <EmptyState title={`Nenhuma pessoa encontrada para "${search}"`} />
        ) : (
          <div className={styles.list}>
            {filtered.map((person) => (
              <PersonCard
                key={person.nome}
                person={person}
                isOpen={expanded === person.nome}
                onToggleOpen={() => setExpanded(expanded === person.nome ? null : person.nome)}
                onTogglePaid={handleToggle}
              />
            ))}
          </div>
        )}
      </QueryState>
    </div>
  );
}

interface PersonCardProps {
  person: Person;
  isOpen: boolean;
  onToggleOpen: () => void;
  onTogglePaid: (item: SplitItem) => void;
}

function PersonCard({ person, isOpen, onToggleOpen, onTogglePaid }: PersonCardProps) {
  return (
    <div className={styles.card}>
      <button type="button" className={styles.cardHeader} onClick={onToggleOpen}>
        <div className={styles.avatar}>{person.nome.charAt(0).toUpperCase()}</div>
        <div className={styles.info}>
          <div className={styles.name}>{person.nome}</div>
          <div className={styles.meta}>{person.itens.length} despesa(s) dividida(s)</div>
        </div>
        <div className={styles.amounts}>
          {person.totalDevido > 0 && (
            <Badge tone="negative">
              <MoneyFigure value={person.totalDevido} sign="neutral" size="sm" /> a receber
            </Badge>
          )}
          {person.totalPago > 0 && (
            <Badge tone="positive">
              <MoneyFigure value={person.totalPago} sign="neutral" size="sm" /> recebido
            </Badge>
          )}
        </div>
        <span className={[styles.chevron, isOpen && styles.chevronOpen].filter(Boolean).join(' ')} aria-hidden="true">
          ▾
        </span>
      </button>

      {isOpen && (
        <div className={styles.items}>
          {person.itens.map((item) => (
            <div key={`${item.transactionId}-${item.participantId}`} className={styles.item}>
              <div>
                <div className={styles.itemDesc}>{item.descricao}</div>
                <div className={styles.itemDate}>{item.data}</div>
              </div>
              <MoneyFigure value={item.valor} sign="neutral" size="sm" />
              <button
                type="button"
                className={[styles.paidToggle, item.pago && styles.paidToggleActive].filter(Boolean).join(' ')}
                onClick={() => onTogglePaid(item)}
              >
                {item.pago ? '✓ Pago' : 'Marcar como pago'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
