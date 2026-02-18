import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';
import { RouteDetail } from '@/types/api';

export function updateRoute({
  raceId,
  routeId,
  data,
}: {
  raceId: number;
  routeId: number;
  data: Partial<RouteDetail>;
}): Promise<RouteDetail> {
  return apiFetch<RouteDetail>(`/races/${raceId}/routes/${routeId}`, {
    method: 'PATCH',
    body: JSON.stringify({ route: data }),
  });
}

export function useUpdateRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRoute,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['routes', variables.raceId],
      });
      queryClient.invalidateQueries({
        queryKey: ['route', variables.raceId, variables.routeId],
      });
    },
  });
}
