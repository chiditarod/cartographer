import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';

export interface RaceLeg {
  id: number;
  start_id: number;
  finish_id: number;
  start_name: string;
  finish_name: string;
  distance: number;
  distance_display: string;
}

function getRaceLegs(raceId: number): Promise<RaceLeg[]> {
  return apiFetch<RaceLeg[]>(`/races/${raceId}/legs`);
}

export function useRaceLegs(raceId: number) {
  return useQuery({
    queryKey: ['race-legs', raceId],
    queryFn: () => getRaceLegs(raceId),
  });
}
