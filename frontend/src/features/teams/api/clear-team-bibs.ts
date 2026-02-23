import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';
import type { Team } from '@/types/api';

export function clearTeamBibs(raceId: number): Promise<Team[]> {
  return apiFetch<Team[]>(`/races/${raceId}/teams/clear_bibs`, {
    method: 'POST',
  });
}

export function useClearTeamBibs(raceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => clearTeamBibs(raceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', raceId] });
    },
  });
}
