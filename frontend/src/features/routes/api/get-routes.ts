import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';
import { RouteSummary } from '@/types/api';

export function getRoutes(raceId: number): Promise<RouteSummary[]> {
  return apiFetch<RouteSummary[]>(`/races/${raceId}/routes`);
}

export function useRoutes(raceId: number) {
  return useQuery({
    queryKey: ['routes', raceId],
    queryFn: () => getRoutes(raceId),
  });
}
