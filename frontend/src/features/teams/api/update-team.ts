import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';
import type { Team } from '@/types/api';

interface UpdateTeamParams {
  bib_number: number | null;
}

export function updateTeam(
  raceId: number,
  teamId: number,
  params: UpdateTeamParams,
): Promise<Team> {
  return apiFetch<Team>(`/races/${raceId}/teams/${teamId}`, {
    method: 'PATCH',
    body: JSON.stringify({ team: params }),
  });
}

export function useUpdateTeam(raceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, ...params }: UpdateTeamParams & { teamId: number }) =>
      updateTeam(raceId, teamId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', raceId] });
    },
  });
}
