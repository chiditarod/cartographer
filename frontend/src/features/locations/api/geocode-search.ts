import { apiFetch } from '@/lib/api-client';

export interface GeocodeResult {
  formatted_address: string;
  name: string;
  street_address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
}

export function geocodeSearch(query: string): Promise<GeocodeResult[]> {
  return apiFetch<GeocodeResult[]>(
    `/geocode_search?query=${encodeURIComponent(query)}`,
  );
}
