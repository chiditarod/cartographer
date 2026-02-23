import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';
import { RouteSummary } from '@/types/api';

interface CreateRouteParams {
  raceId: number;
  name?: string;
  location_ids: number[];
}

function createRoute({ raceId, name, location_ids }: CreateRouteParams): Promise<RouteSummary> {
  return apiFetch<RouteSummary>(`/races/${raceId}/routes`, {
    method: 'POST',
    body: JSON.stringify({ route: { name, location_ids } }),
  });
}

export function useCreateRoute(raceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes', raceId] });
      queryClient.invalidateQueries({ queryKey: ['race', raceId] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}
