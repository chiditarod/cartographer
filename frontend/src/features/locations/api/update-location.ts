import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';
import { Location } from '@/types/api';

export function updateLocation({
  id,
  data,
}: {
  id: number;
  data: Partial<Location>;
}): Promise<Location> {
  return apiFetch<Location>(`/locations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ location: data }),
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLocation,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['location', variables.id] });
    },
  });
}
