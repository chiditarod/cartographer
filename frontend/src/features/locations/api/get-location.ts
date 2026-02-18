import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';
import { Location } from '@/types/api';

export function getLocation(id: number): Promise<Location> {
  return apiFetch<Location>(`/locations/${id}`);
}

export function useLocation(id: number) {
  return useQuery({
    queryKey: ['location', id],
    queryFn: () => getLocation(id),
  });
}
