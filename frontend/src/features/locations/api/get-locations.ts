import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';
import { Location } from '@/types/api';

export function getLocations(): Promise<Location[]> {
  return apiFetch<Location[]>('/locations');
}

export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: getLocations,
  });
}
