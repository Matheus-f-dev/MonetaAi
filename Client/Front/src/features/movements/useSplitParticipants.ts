import { useState } from 'react';

// Extraído do TransactionModal (Fase 3) quando a Rachadinha ganhou página
// própria (features/people/RachadinhaPage.tsx) -- as duas telas precisam
// exatamente da mesma lógica de participantes (gerar divisão igual,
// transferir a parte de alguém pra outra pessoa pagar), só o layout em
// volta muda (modal estreito vs. página inteira). Um hook só, sem JSX,
// evita o bug de transferência (ou o de gerar linha) divergir entre as
// duas telas com o tempo.
export interface SplitParticipantDraft {
  nome: string;
  valor: string;
}

export const EMPTY_PARTICIPANTS: SplitParticipantDraft[] = [
  { nome: '', valor: '' },
  { nome: '', valor: '' }
];

export function useSplitParticipants(initial: SplitParticipantDraft[] = EMPTY_PARTICIPANTS) {
  const [participants, setParticipants] = useState<SplitParticipantDraft[]>(initial);
  const [headcount, setHeadcount] = useState('2');

  // Histórico só da LISTA de participantes (não do headcount, que é só
  // um campo de rascunho até alguém clicar "Gerar divisão igual") --
  // pedido do usuário depois de transferir a parte de uma pessoa pra
  // outra e não achar como voltar: transferTo remove a linha de origem
  // de vez (ver abaixo), então sem isso não tinha como desfazer.
  const [history, setHistory] = useState<SplitParticipantDraft[][]>([]);

  function snapshot() {
    setHistory((prev) => [...prev, participants]);
  }

  function updateParticipant(index: number, field: 'nome' | 'valor', value: string) {
    setParticipants((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }

  function addParticipant() {
    snapshot();
    setParticipants((prev) => [...prev, { nome: '', valor: '' }]);
  }

  function removeParticipant(index: number) {
    snapshot();
    setParticipants((prev) => prev.filter((_, i) => i !== index));
  }

  // "Transferir pra outra pessoa" -- o caso especial pedido pelo usuário:
  // em vez de marcar como "não paga" ou excluir sem mais, a parte dessa
  // pessoa some e vira um acréscimo na parte de quem vai cobrir.
  function transferTo(index: number, targetIndex: number) {
    snapshot();
    setParticipants((prev) => {
      const amount = parseFloat(prev[index]?.valor) || 0;
      const withTransfer = prev.map((p, i) => {
        if (i !== targetIndex) return p;
        const currentValue = parseFloat(p.valor) || 0;
        return { ...p, valor: (currentValue + amount).toFixed(2) };
      });
      return withTransfer.filter((_, i) => i !== index);
    });
  }

  // Rachadinha -- gera N linhas (preservando nome de quem já estava
  // digitado, quando dá) com o valor total dividido igualmente. Decide a
  // QUANTIDADE de linhas, não só redivide as que já existem (ver
  // splitEqually abaixo, que faz só a segunda parte).
  function generateEqualSplit(total: number) {
    snapshot();
    const n = Math.max(1, parseInt(headcount, 10) || 1);
    const share = (total / n).toFixed(2);
    setParticipants((prev) => Array.from({ length: n }, (_, i) => ({ nome: prev[i]?.nome || '', valor: share })));
  }

  function splitEqually(total: number) {
    snapshot();
    const n = participants.length || 1;
    const share = (total / n).toFixed(2);
    setParticipants((prev) => prev.map((p) => ({ ...p, valor: share })));
  }

  // Desfaz a última ação estrutural (transferência, divisão gerada,
  // adicionar/remover pessoa) -- não cobre edição de nome/valor campo a
  // campo, pra não precisar empilhar um snapshot a cada tecla digitada.
  function undo() {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      setParticipants(prev[prev.length - 1]);
      return prev.slice(0, -1);
    });
  }

  function reset(next: SplitParticipantDraft[] = EMPTY_PARTICIPANTS, nextHeadcount?: string) {
    setParticipants(next);
    setHeadcount(nextHeadcount ?? String(Math.max(2, next.length)));
    setHistory([]);
  }

  return {
    participants,
    headcount,
    setHeadcount,
    updateParticipant,
    addParticipant,
    removeParticipant,
    transferTo,
    generateEqualSplit,
    splitEqually,
    undo,
    canUndo: history.length > 0,
    reset
  };
}
