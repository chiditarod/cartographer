import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';
import { Stats } from '@/types/api';

export function getStats(): Promise<Stats> {
  return apiFetch<Stats>('/stats');
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
  });
}
