import { useMutation } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';

export function generateLegs({
  raceId,
  mock,
}: {
  raceId: number;
  mock?: boolean;
}): Promise<{ job_status_id: number }> {
  const params = mock ? '?mock=true' : '';
  return apiFetch<{ job_status_id: number }>(
    `/races/${raceId}/generate_legs${params}`,
    { method: 'POST' },
  );
}

export function useGenerateLegs() {
  return useMutation({
    mutationFn: generateLegs,
  });
}
