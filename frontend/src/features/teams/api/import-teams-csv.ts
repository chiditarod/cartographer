import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';
import type { CsvImportResult } from '@/types/api';

export function importTeamsCsv(
  raceId: number,
  file: File,
): Promise<CsvImportResult> {
  const fd = new FormData();
  fd.append('file', file);
  return apiFetch<CsvImportResult>(`/races/${raceId}/teams/import_csv`, {
    method: 'POST',
    body: fd,
  });
}

export function useImportTeamsCsv(raceId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => importTeamsCsv(raceId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', raceId] });
      queryClient.invalidateQueries({ queryKey: ['race', raceId] });
    },
  });
}
