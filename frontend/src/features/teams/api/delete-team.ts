import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';

export function deleteTeam(
  raceId: number,
  teamId: number | 'all' | 'imported',
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(
    `/races/${raceId}/teams/${teamId}`,
    { method: 'DELETE' },
  );
}

export function useDeleteTeam(raceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (teamId: number | 'all' | 'imported') => deleteTeam(raceId, teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', raceId] });
      queryClient.invalidateQueries({ queryKey: ['race', raceId] });
    },
  });
}
