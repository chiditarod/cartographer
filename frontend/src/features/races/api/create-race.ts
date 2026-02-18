import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';
import { Race } from '@/types/api';

export function createRace(data: Partial<Race>): Promise<Race> {
  return apiFetch<Race>('/races', {
    method: 'POST',
    body: JSON.stringify({ race: data }),
  });
}

export function useCreateRace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['races'] });
    },
  });
}
