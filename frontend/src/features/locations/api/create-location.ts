import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';
import { Location } from '@/types/api';

export function createLocation(data: Partial<Location>): Promise<Location> {
  return apiFetch<Location>('/locations', {
    method: 'POST',
    body: JSON.stringify({ location: data }),
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}
