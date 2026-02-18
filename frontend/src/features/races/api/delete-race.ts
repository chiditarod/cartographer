import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';

export function deleteRace(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/races/${id}`, {
    method: 'DELETE',
  });
}

export function useDeleteRace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['races'] });
    },
  });
}
