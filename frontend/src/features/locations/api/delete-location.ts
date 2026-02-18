import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';

export function deleteLocation(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/locations/${id}`, {
    method: 'DELETE',
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}
