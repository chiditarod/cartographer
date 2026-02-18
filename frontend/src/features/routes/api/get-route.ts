import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';
import { RouteDetail } from '@/types/api';

export function getRoute({
  raceId,
  routeId,
}: {
  raceId: number;
  routeId: number;
}): Promise<RouteDetail> {
  return apiFetch<RouteDetail>(`/races/${raceId}/routes/${routeId}`);
}

export function useRoute(raceId: number, routeId: number) {
  return useQuery({
    queryKey: ['route', raceId, routeId],
    queryFn: () => getRoute({ raceId, routeId }),
  });
}
