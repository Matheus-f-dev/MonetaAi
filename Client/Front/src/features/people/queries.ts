import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUserId } from '../dashboard/queries';
import { fetchPeople, setParticipantPaid } from './api';

export { useCurrentUserId };

export function usePeopleQuery(userId: string | null) {
  return useQuery({
    queryKey: ['people', userId],
    queryFn: () => fetchPeople(userId as string),
    enabled: Boolean(userId)
  });
}

export function useSetParticipantPaidMutation() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();
  return useMutation({
    mutationFn: ({ transactionId, participantIndex, pago }: { transactionId: string; participantIndex: number; pago: boolean }) =>
      setParticipantPaid(transactionId, participantIndex, pago),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['people', userId] })
  });
}
