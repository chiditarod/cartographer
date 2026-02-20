import type { Race } from '@/types/api';

interface BuildOptions {
  data: Partial<Race>;
  logoFile?: File | null;
  deleteLogo?: boolean;
}

export function buildRaceBody({
  data,
  logoFile,
  deleteLogo,
}: BuildOptions): FormData | string {
  const needsFormData = logoFile || deleteLogo;

  if (!needsFormData) {
    return JSON.stringify({ race: data });
  }

  const fd = new FormData();

  const scalarFields = [
    'name',
    'num_stops',
    'max_teams',
    'people_per_team',
    'min_total_distance',
    'max_total_distance',
    'min_leg_distance',
    'max_leg_distance',
    'distance_unit',
    'start_id',
    'finish_id',
    'blank_timecards_per_route',
  ] as const;

  for (const key of scalarFields) {
    const val = data[key];
    if (val != null) {
      fd.append(`race[${key}]`, String(val));
    }
  }

  if (data.location_ids) {
    for (const id of data.location_ids) {
      fd.append('race[location_ids][]', String(id));
    }
  }

  if (logoFile) {
    fd.append('race[logo]', logoFile);
  }

  if (deleteLogo) {
    fd.append('race[delete_logo]', 'true');
  }

  return fd;
}
