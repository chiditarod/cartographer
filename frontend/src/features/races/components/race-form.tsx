import { useState, type FormEvent } from 'react';

import type { Race } from '@/types/api';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { LocationPicker } from '@/features/races/components/location-picker';
import { useLocations } from '@/features/locations/api/get-locations';

interface RaceFormData {
  name: string;
  num_stops: string;
  max_teams: string;
  people_per_team: string;
  min_total_distance: string;
  max_total_distance: string;
  min_leg_distance: string;
  max_leg_distance: string;
  distance_unit: 'mi' | 'km';
  start_id: string;
  finish_id: string;
  location_ids: number[];
}

interface RaceFormProps {
  initialData?: Race;
  onSubmit: (data: Partial<Race>) => void;
  isSubmitting: boolean;
}

function toFormData(race?: Race): RaceFormData {
  return {
    name: race?.name ?? '',
    num_stops: race?.num_stops != null ? String(race.num_stops) : '',
    max_teams: race?.max_teams != null ? String(race.max_teams) : '',
    people_per_team: race?.people_per_team != null ? String(race.people_per_team) : '',
    min_total_distance: race?.min_total_distance != null ? String(race.min_total_distance) : '',
    max_total_distance: race?.max_total_distance != null ? String(race.max_total_distance) : '',
    min_leg_distance: race?.min_leg_distance != null ? String(race.min_leg_distance) : '',
    max_leg_distance: race?.max_leg_distance != null ? String(race.max_leg_distance) : '',
    distance_unit: race?.distance_unit ?? 'mi',
    start_id: race?.start_id != null ? String(race.start_id) : '',
    finish_id: race?.finish_id != null ? String(race.finish_id) : '',
    location_ids: race?.location_ids ?? [],
  };
}

export function RaceForm({ initialData, onSubmit, isSubmitting }: RaceFormProps) {
  const [form, setForm] = useState<RaceFormData>(() => toFormData(initialData));
  const { data: locations } = useLocations();

  const handleChange = (field: keyof Omit<RaceFormData, 'location_ids'>) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const locationOptions = (locations ?? []).map((loc) => ({
    value: loc.id,
    label: loc.name,
  }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const data: Partial<Race> = {
      name: form.name,
      num_stops: Number(form.num_stops),
      max_teams: Number(form.max_teams),
      people_per_team: Number(form.people_per_team),
      min_total_distance: Number(form.min_total_distance),
      max_total_distance: Number(form.max_total_distance),
      min_leg_distance: Number(form.min_leg_distance),
      max_leg_distance: Number(form.max_leg_distance),
      distance_unit: form.distance_unit,
      start_id: Number(form.start_id),
      finish_id: Number(form.finish_id),
      location_ids: form.location_ids,
    };
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Name"
        value={form.name}
        onChange={handleChange('name')}
        required
      />

      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Number of Stops"
          type="number"
          value={form.num_stops}
          onChange={handleChange('num_stops')}
          required
        />
        <Input
          label="Max Teams"
          type="number"
          value={form.max_teams}
          onChange={handleChange('max_teams')}
          required
        />
        <Input
          label="People per Team"
          type="number"
          value={form.people_per_team}
          onChange={handleChange('people_per_team')}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Min Total Distance"
          type="number"
          step="any"
          value={form.min_total_distance}
          onChange={handleChange('min_total_distance')}
          required
        />
        <Input
          label="Max Total Distance"
          type="number"
          step="any"
          value={form.max_total_distance}
          onChange={handleChange('max_total_distance')}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Min Leg Distance"
          type="number"
          step="any"
          value={form.min_leg_distance}
          onChange={handleChange('min_leg_distance')}
          required
        />
        <Input
          label="Max Leg Distance"
          type="number"
          step="any"
          value={form.max_leg_distance}
          onChange={handleChange('max_leg_distance')}
          required
        />
      </div>

      <Select
        label="Distance Unit"
        value={form.distance_unit}
        onChange={handleChange('distance_unit')}
        options={[
          { value: 'mi', label: 'Miles' },
          { value: 'km', label: 'Kilometers' },
        ]}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Start Location"
          value={form.start_id}
          onChange={handleChange('start_id')}
          options={locationOptions}
          placeholder="Select start..."
        />
        <Select
          label="Finish Location"
          value={form.finish_id}
          onChange={handleChange('finish_id')}
          options={locationOptions}
          placeholder="Select finish..."
        />
      </div>

      <LocationPicker
        selectedIds={form.location_ids}
        onChange={(ids) => setForm((prev) => ({ ...prev, location_ids: ids }))}
      />

      <div className="pt-2">
        <Button type="submit" loading={isSubmitting}>
          {initialData ? 'Update Race' : 'Create Race'}
        </Button>
      </div>
    </form>
  );
}
