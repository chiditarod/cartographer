import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';
import { Race } from '@/types/api';
import { buildRaceBody } from '@/features/races/utils/build-race-form-data';

interface UpdateRaceVars {
  id: number;
  data: Partial<Race>;
  logoFile?: File | null;
  deleteLogo?: boolean;
}

export function updateRace({
  id,
  data,
  logoFile,
  deleteLogo,
}: UpdateRaceVars): Promise<Race> {
  return apiFetch<Race>(`/races/${id}`, {
    method: 'PATCH',
    body: buildRaceBody({ data, logoFile, deleteLogo }),
  });
}

export function useUpdateRace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRace,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['races'] });
      queryClient.invalidateQueries({ queryKey: ['race', variables.id] });
    },
  });
}
