import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';
import { Race } from '@/types/api';

export function updateRace({
  id,
  data,
}: {
  id: number;
  data: Partial<Race>;
}): Promise<Race> {
  return apiFetch<Race>(`/races/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ race: data }),
  });
}

export function useUpdateRace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRace,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['races'] });
      queryClient.invalidateQueries({ queryKey: ['race', variables.id] });
    },
  });
}
