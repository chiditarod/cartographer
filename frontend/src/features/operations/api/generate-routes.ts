import { useMutation } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';

export function generateRoutes(
  raceId: number,
): Promise<{ job_status_id: number }> {
  return apiFetch<{ job_status_id: number }>(
    `/races/${raceId}/generate_routes`,
    { method: 'POST' },
  );
}

export function useGenerateRoutes() {
  return useMutation({
    mutationFn: generateRoutes,
  });
}
