import { useState, type FormEvent } from 'react';

import type { Location } from '@/types/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface LocationFormData {
  name: string;
  street_address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  lat: string;
  lng: string;
  max_capacity: string;
  ideal_capacity: string;
}

interface LocationFormProps {
  initialData?: Location;
  onSubmit: (data: Partial<Location>) => void;
  isSubmitting: boolean;
}

function toFormData(location?: Location): LocationFormData {
  return {
    name: location?.name ?? '',
    street_address: location?.street_address ?? '',
    city: location?.city ?? '',
    state: location?.state ?? '',
    zip: location?.zip != null ? String(location.zip) : '',
    country: location?.country ?? '',
    lat: location?.lat != null ? String(location.lat) : '',
    lng: location?.lng != null ? String(location.lng) : '',
    max_capacity: location?.max_capacity != null ? String(location.max_capacity) : '',
    ideal_capacity: location?.ideal_capacity != null ? String(location.ideal_capacity) : '',
  };
}

export function LocationForm({ initialData, onSubmit, isSubmitting }: LocationFormProps) {
  const [form, setForm] = useState<LocationFormData>(() => toFormData(initialData));

  const handleChange = (field: keyof LocationFormData) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const data: Partial<Location> = {
      name: form.name,
      street_address: form.street_address || null,
      city: form.city || null,
      state: form.state || null,
      zip: form.zip ? Number(form.zip) : null,
      country: form.country || null,
      lat: form.lat ? Number(form.lat) : null,
      lng: form.lng ? Number(form.lng) : null,
      max_capacity: form.max_capacity ? Number(form.max_capacity) : 0,
      ideal_capacity: form.ideal_capacity ? Number(form.ideal_capacity) : 0,
    };
    onSubmit(data);
  };

  return (
    <form id="location-form" onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Name"
        value={form.name}
        onChange={handleChange('name')}
        required
      />

      <Input
        label="Street Address"
        value={form.street_address}
        onChange={handleChange('street_address')}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="City"
          value={form.city}
          onChange={handleChange('city')}
        />
        <Input
          label="State"
          value={form.state}
          onChange={handleChange('state')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Zip"
          value={form.zip}
          onChange={handleChange('zip')}
        />
        <Input
          label="Country"
          value={form.country}
          onChange={handleChange('country')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Latitude"
          type="number"
          step="any"
          value={form.lat}
          onChange={handleChange('lat')}
        />
        <Input
          label="Longitude"
          type="number"
          step="any"
          value={form.lng}
          onChange={handleChange('lng')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Max Capacity"
          type="number"
          value={form.max_capacity}
          onChange={handleChange('max_capacity')}
        />
        <Input
          label="Ideal Capacity"
          type="number"
          value={form.ideal_capacity}
          onChange={handleChange('ideal_capacity')}
        />
      </div>

      <div className="pt-2">
        <Button id="location-submit" type="submit" loading={isSubmitting}>
          {initialData ? 'Update Location' : 'Create Location'}
        </Button>
      </div>
    </form>
  );
}
