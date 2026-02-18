import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';
import { Race } from '@/types/api';

export function getRaces(): Promise<Race[]> {
  return apiFetch<Race[]>('/races');
}

export function useRaces() {
  return useQuery({
    queryKey: ['races'],
    queryFn: getRaces,
  });
}
