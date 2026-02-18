import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';
import type { Race } from '@/types/api';

export function duplicateRace(id: number): Promise<Race> {
  return apiFetch<Race>(`/races/${id}/duplicate`, {
    method: 'POST',
  });
}

export function useDuplicateRace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: duplicateRace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['races'] });
    },
  });
}
