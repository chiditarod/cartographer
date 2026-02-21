import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';
import type { Team } from '@/types/api';

interface Assignment {
  team_id: number;
  route_id: number;
}

export function bulkAssignTeams(
  raceId: number,
  assignments: Assignment[],
): Promise<Team[]> {
  return apiFetch<Team[]>(`/races/${raceId}/teams/bulk_assign`, {
    method: 'POST',
    body: JSON.stringify({ assignments }),
  });
}

export function useBulkAssignTeams(raceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignments: Assignment[]) =>
      bulkAssignTeams(raceId, assignments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', raceId] });
    },
  });
}
