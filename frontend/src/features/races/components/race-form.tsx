import { useState, useEffect, useRef, type FormEvent } from 'react';

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
  extra_timecards: string;
  blank_checkin_cards: string;
  checkin_card_content: string;
}

interface RaceFormProps {
  initialData?: Race;
  onSubmit: (data: Partial<Race>, logoFile?: File | null, deleteLogo?: boolean) => void;
  isSubmitting: boolean;
  error?: string | null;
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
    extra_timecards: race?.extra_timecards != null ? String(race.extra_timecards) : '0',
    blank_checkin_cards: race?.blank_checkin_cards != null ? String(race.blank_checkin_cards) : '0',
    checkin_card_content: race?.checkin_card_content ?? '',
  };
}

function validateForm(form: RaceFormData): string[] {
  const errors: string[] = [];

  if (!form.start_id) errors.push('Start location is required.');
  if (!form.finish_id) errors.push('Finish location is required.');

  const minTotal = Number(form.min_total_distance);
  const maxTotal = Number(form.max_total_distance);
  if (minTotal && maxTotal && maxTotal < minTotal) {
    errors.push('Max total distance must be greater than min total distance.');
  }

  const minLeg = Number(form.min_leg_distance);
  const maxLeg = Number(form.max_leg_distance);
  if (minLeg && maxLeg && maxLeg < minLeg) {
    errors.push('Max leg distance must be greater than min leg distance.');
  }

  if (form.location_ids.length === 0) {
    errors.push('At least one location must be in the pool.');
  }

  return errors;
}

export function RaceForm({ initialData, onSubmit, isSubmitting, error }: RaceFormProps) {
  const [form, setForm] = useState<RaceFormData>(() => toFormData(initialData));
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { data: locations } = useLocations();

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    initialData?.logo_url ?? null,
  );
  const [deleteLogo, setDeleteLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!logoFile) return;
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  const handleChange = (field: keyof Omit<RaceFormData, 'location_ids'>) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (validationErrors.length > 0) setValidationErrors([]);
  };

  const locationOptions = (locations ?? []).map((loc) => ({
    value: loc.id,
    label: loc.name,
  }));

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      setLogoFile(file);
      setDeleteLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setDeleteLogo(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errors = validateForm(form);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);

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
      extra_timecards: Number(form.extra_timecards),
      blank_checkin_cards: Number(form.blank_checkin_cards),
      checkin_card_content: form.checkin_card_content,
    };
    onSubmit(data, logoFile, deleteLogo);
  };

  const displayError = validationErrors.length > 0 ? validationErrors.join(' ') : error;

  return (
    <form id="race-form" onSubmit={handleSubmit} className="space-y-4">
      {displayError && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-700">{displayError}</p>
        </div>
      )}

      <Input
        id="race-name"
        label="Name"
        value={form.name}
        onChange={handleChange('name')}
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Race Logo
        </label>
        <input
          ref={fileInputRef}
          id="race-logo"
          type="file"
          accept="image/png,image/jpeg"
          onChange={handleLogoChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {logoPreview && (
          <div className="mt-2 flex items-center gap-3">
            <img
              src={logoPreview}
              alt="Logo preview"
              className="h-12 w-auto rounded border border-gray-200"
            />
            <button
              id="remove-logo-btn"
              type="button"
              onClick={handleRemoveLogo}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-5 gap-4">
        <Input
          id="race-num-stops"
          label="Number of Stops"
          type="number"
          value={form.num_stops}
          onChange={handleChange('num_stops')}
          required
        />
        <Input
          id="race-max-teams"
          label="Max Teams"
          type="number"
          value={form.max_teams}
          onChange={handleChange('max_teams')}
          required
        />
        <Input
          id="race-people-per-team"
          label="People per Team"
          type="number"
          value={form.people_per_team}
          onChange={handleChange('people_per_team')}
          required
        />
        <Input
          id="race-blank-timecards"
          label="Extra Timecards"
          type="number"
          min="0"
          value={form.extra_timecards}
          onChange={handleChange('extra_timecards')}
        />
        <Input
          id="race-blank-checkin-cards"
          label="Spare Check-in Cards"
          type="number"
          min="0"
          value={form.blank_checkin_cards}
          onChange={handleChange('blank_checkin_cards')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="race-min-total-distance"
          label="Min Total Distance"
          type="number"
          step="any"
          value={form.min_total_distance}
          onChange={handleChange('min_total_distance')}
          required
        />
        <Input
          id="race-max-total-distance"
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
          id="race-min-leg-distance"
          label="Min Leg Distance"
          type="number"
          step="any"
          value={form.min_leg_distance}
          onChange={handleChange('min_leg_distance')}
          required
        />
        <Input
          id="race-max-leg-distance"
          label="Max Leg Distance"
          type="number"
          step="any"
          value={form.max_leg_distance}
          onChange={handleChange('max_leg_distance')}
          required
        />
      </div>

      <Select
        id="race-distance-unit"
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
          id="race-start-location"
          label="Start Location"
          value={form.start_id}
          onChange={handleChange('start_id')}
          options={locationOptions}
          placeholder="Select start..."
        />
        <Select
          id="race-finish-location"
          label="Finish Location"
          value={form.finish_id}
          onChange={handleChange('finish_id')}
          options={locationOptions}
          placeholder="Select finish..."
        />
      </div>

      <LocationPicker
        selectedIds={form.location_ids}
        onChange={(ids) => {
          setForm((prev) => ({ ...prev, location_ids: ids }));
          if (validationErrors.length > 0) setValidationErrors([]);
        }}
      />

      <div className="pt-2">
        <Button id="race-submit" type="submit" loading={isSubmitting}>
          {initialData ? 'Update Race' : 'Create Race'}
        </Button>
      </div>
    </form>
  );
}
