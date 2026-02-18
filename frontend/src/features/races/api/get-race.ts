import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';
import { Race } from '@/types/api';

export function getRace(id: number): Promise<Race> {
  return apiFetch<Race>(`/races/${id}`);
}

export function useRace(id: number) {
  return useQuery({
    queryKey: ['race', id],
    queryFn: () => getRace(id),
  });
}
