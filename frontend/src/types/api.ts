export interface Location {
  id: number;
  name: string;
  street_address: string | null;
  city: string | null;
  state: string | null;
  zip: number | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  max_capacity: number;
  ideal_capacity: number;
  full_address: string;
  geocoded: boolean;
  created_at: string;
  updated_at: string;
}

export interface Race {
  id: number;
  name: string;
  num_stops: number;
  max_teams: number;
  people_per_team: number;
  min_total_distance: number;
  max_total_distance: number;
  min_leg_distance: number;
  max_leg_distance: number;
  start_id: number;
  finish_id: number;
  distance_unit: 'mi' | 'km';
  location_ids: number[];
  route_count: number;
  logo_url: string | null;
  start?: { id: number; name: string };
  finish?: { id: number; name: string };
  locations?: { id: number; name: string; street_address: string }[];
  leg_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Leg {
  id: number;
  start: { id: number; name: string };
  finish: { id: number; name: string };
  distance: number;
  created_at: string;
}

export interface RouteSummary {
  id: number;
  name: string | null;
  race_id: number;
  complete: boolean;
  distance: number;
  distance_unit: 'mi' | 'km';
  leg_count: number;
  target_leg_count: number;
  location_sequence: { id: number; name: string }[];
  leg_distances: { distance: number; distance_display: string }[];
  rarity_score: number | null;
  selected: boolean;
  created_at: string;
}

export interface RouteDetail extends RouteSummary {
  legs: RouteLeg[];
  map_url: string | null;
  csv: string;
}

export interface RouteLeg {
  id: number;
  start: LocationBrief;
  finish: LocationBrief;
  distance: number;
  distance_display: string;
}

export interface LocationBrief {
  id: number;
  name: string;
  lat: number | null;
  lng: number | null;
}

export interface JobStatus {
  id: number;
  job_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  total: number;
  message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Stats {
  locations: number;
  races: number;
  legs: number;
  routes: number;
  complete_routes: number;
}
