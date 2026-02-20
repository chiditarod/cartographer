import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';
import type { Team } from '@/types/api';

export function getTeams(raceId: number): Promise<Team[]> {
  return apiFetch<Team[]>(`/races/${raceId}/teams`);
}

export function useTeams(raceId: number) {
  return useQuery({
    queryKey: ['teams', raceId],
    queryFn: () => getTeams(raceId),
  });
}
