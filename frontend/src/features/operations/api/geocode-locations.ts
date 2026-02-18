import { useMutation } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';

export function geocodeLocations(
  locationIds: number[],
): Promise<{ job_status_id: number }> {
  return apiFetch<{ job_status_id: number }>('/geocode', {
    method: 'POST',
    body: JSON.stringify({ location_ids: locationIds }),
  });
}

export function useGeocodeLocations() {
  return useMutation({
    mutationFn: geocodeLocations,
  });
}
