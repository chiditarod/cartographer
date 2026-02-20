import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';
import type { Team } from '@/types/api';

interface CreateTeamParams {
  name: string;
  bib_number: number;
}

export function createTeam(
  raceId: number,
  params: CreateTeamParams,
): Promise<Team> {
  return apiFetch<Team>(`/races/${raceId}/teams`, {
    method: 'POST',
    body: JSON.stringify({ team: params }),
  });
}

export function useCreateTeam(raceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateTeamParams) => createTeam(raceId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', raceId] });
      queryClient.invalidateQueries({ queryKey: ['race', raceId] });
    },
  });
}
