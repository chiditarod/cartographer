import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';

export function deleteAllRoutes({
  raceId,
}: {
  raceId: number;
}): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/races/${raceId}/routes/all`, {
    method: 'DELETE',
  });
}

export function useDeleteAllRoutes(raceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAllRoutes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes', raceId] });
    },
  });
}
