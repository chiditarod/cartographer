import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';

export function deleteRoute({
  raceId,
  routeId,
}: {
  raceId: number;
  routeId: number;
}): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/races/${raceId}/routes/${routeId}`, {
    method: 'DELETE',
  });
}

export function useDeleteRoute(raceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes', raceId] });
    },
  });
}
