import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';

interface BulkSelectParams {
  raceId: number;
  ids: number[];
}

interface BulkSelectResponse {
  selected_ids: number[];
}

export function bulkSelectRoutes(
  params: BulkSelectParams,
): Promise<BulkSelectResponse> {
  return apiFetch<BulkSelectResponse>(
    `/races/${params.raceId}/routes/bulk_select`,
    {
      method: 'POST',
      body: JSON.stringify({ ids: params.ids }),
    },
  );
}

export function useBulkSelectRoutes(raceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkSelectRoutes,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['routes', raceId],
      });
    },
  });
}
