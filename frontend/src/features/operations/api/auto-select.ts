import { useMutation } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';

interface AutoSelectParams {
  raceId: number;
  count: number;
}

interface AutoSelectResponse {
  route_ids: number[];
}

export function autoSelectRoutes(
  params: AutoSelectParams,
): Promise<AutoSelectResponse> {
  return apiFetch<AutoSelectResponse>(
    `/races/${params.raceId}/auto_select`,
    {
      method: 'POST',
      body: JSON.stringify({ count: params.count }),
    },
  );
}

export function useAutoSelectRoutes() {
  return useMutation({
    mutationFn: autoSelectRoutes,
  });
}
