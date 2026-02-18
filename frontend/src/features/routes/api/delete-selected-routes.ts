import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';

export function deleteSelectedRoutes({
  raceId,
  ids,
}: {
  raceId: number;
  ids: number[];
}): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/races/${raceId}/routes/bulk`, {
    method: 'DELETE',
    body: JSON.stringify({ ids }),
  });
}

export function useDeleteSelectedRoutes(raceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSelectedRoutes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes', raceId] });
      queryClient.invalidateQueries({ queryKey: ['race', raceId] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
