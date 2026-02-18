import { useMutation } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';

export function rankRoutes(
  raceId: number,
): Promise<{ job_status_id: number }> {
  return apiFetch<{ job_status_id: number }>(
    `/races/${raceId}/rank_routes`,
    { method: 'POST' },
  );
}

export function useRankRoutes() {
  return useMutation({
    mutationFn: rankRoutes,
  });
}
