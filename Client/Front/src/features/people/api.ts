import ApiConnection from '../../core/services/ApiConnection';

function assertSuccess<T extends { success: boolean; message?: string }>(data: T): T {
  if (!data.success) {
    throw new Error(data.message || 'Erro ao buscar dados.');
  }
  return data;
}

export interface SplitItem {
  transactionId: string;
  participantId: string;
  /** Posição do participante entre os participantes DAQUELA transação --
   * é o que a rota de toggle usa pra identificar quem marcar (contrato
   * herdado de quando split era array no Firestore; ver comentário no
   * backend em SplitController.getPeople). Não é o mesmo que
   * `participantId`. */
  participantIndex: number;
  descricao: string;
  valor: number;
  pago: boolean;
  pagoEm: string | null;
  data: string;
}

export interface Person {
  nome: string;
  totalDevido: number;
  totalPago: number;
  itens: SplitItem[];
}

export async function fetchPeople(userId: string): Promise<Person[]> {
  const api = new ApiConnection();
  const data = assertSuccess(await api.get(`/api/split/${userId}/people`));
  return data.people ?? [];
}

export async function setParticipantPaid(transactionId: string, participantIndex: number, pago: boolean) {
  const api = new ApiConnection();
  return assertSuccess(await api.put(`/api/split/transactions/${transactionId}/participants/${participantIndex}`, { pago }));
}
