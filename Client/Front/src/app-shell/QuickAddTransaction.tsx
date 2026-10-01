import { useEffect, useState } from 'react';
import { TransactionModal } from '../features/movements/components/TransactionModal';
import { useCreateTransactionMutation, useCurrentUserId } from '../features/movements/queries';
import type { TransactionPayload } from '../features/movements/api';
import { useAccounts } from '../presentation/hooks/useAccounts';
import { useCards } from '../presentation/hooks/useCards';
import { usePeople } from '../presentation/hooks/usePeople';
import { useToast } from '../presentation/hooks/useToast';
import observerService from '../core/services/ObserverService';
import styles from './QuickAddTransaction.module.css';

const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function isTypingTarget(el: Element | null): boolean {
  if (!el) return false;
  if (EDITABLE_TAGS.has(el.tagName)) return true;
  return (el as HTMLElement).isContentEditable;
}

/**
 * Ideia nova (não pedida, "pensa fora da caixa" -- ver conversa): lançar um
 * gasto/receita é a ação mais repetida do app inteiro, mas até aqui só
 * existia dentro de Gastos/Receitas/Pessoas, cada uma com seu próprio
 * "+ Nova despesa". Isso duplica o atalho em QUALQUER tela: botão
 * flutuante sempre visível (AppShell, então aparece em todo lugar
 * logado) e a tecla "N" solta (sem Ctrl/Alt/Cmd, e só fora de um campo de
 * texto/select/modal já aberto) abre o mesmo TransactionModal de sempre.
 * Reaproveita tudo que Gastos/Receitas já usam (accounts/cards/people,
 * useCreateTransactionMutation, ObserverService) -- nenhuma lógica nova de
 * transação, só um ponto de entrada a mais pra ela.
 */
export function QuickAddTransaction() {
  const userId = useCurrentUserId();
  const { addToast } = useToast();
  const { accounts } = useAccounts(userId);
  const { cards } = useCards(userId);
  const { people } = usePeople(userId);
  const createMutation = useCreateTransactionMutation();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== 'n' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (isOpen || isTypingTarget(document.activeElement)) return;
      // Já tem algum outro modal aberto (editar meta, confirmar Rachadinha,
      // etc.) -- não empilha o de cima, só ignora a tecla.
      if (document.querySelector('[role="dialog"]')) return;

      e.preventDefault();
      setIsOpen(true);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  async function handleSubmit(payload: Omit<TransactionPayload, 'userId'>) {
    try {
      await createMutation.mutateAsync({ ...payload, userId: userId as string });
      observerService.notify({ ...payload, userId });
      addToast('Transação adicionada com sucesso!', 'success');
      setIsOpen(false);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Erro ao salvar transação', 'error');
    }
  }

  if (!userId) return null;

  return (
    <>
      <button
        type="button"
        className={styles.fab}
        onClick={() => setIsOpen(true)}
        aria-label="Nova transação rápida (atalho: tecla N)"
        title="Nova transação (N)"
      >
        +
      </button>

      <TransactionModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        accounts={accounts}
        cards={cards}
        knownNames={people.map((p: { nome: string }) => p.nome)}
        isSubmitting={createMutation.isPending}
      />
    </>
  );
}
