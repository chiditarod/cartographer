import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';
import { Race } from '@/types/api';
import { buildRaceBody } from '@/features/races/utils/build-race-form-data';

interface CreateRaceVars {
  data: Partial<Race>;
  logoFile?: File | null;
}

export function createRace({ data, logoFile }: CreateRaceVars): Promise<Race> {
  return apiFetch<Race>('/races', {
    method: 'POST',
    body: buildRaceBody({ data, logoFile }),
  });
}

export function useCreateRace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['races'] });
    },
  });
}
