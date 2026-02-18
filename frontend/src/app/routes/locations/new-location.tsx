import { useNavigate } from 'react-router-dom';
import { LocationForm } from '@/features/locations/components/location-form';
import { useCreateLocation } from '@/features/locations/api/create-location';
import { formatMutationError } from '@/utils/format';

export function NewLocationRoute() {
  const navigate = useNavigate();
  const createMutation = useCreateLocation();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Location</h1>
      <div className="max-w-2xl">
        <LocationForm
          onSubmit={(data) => {
            createMutation.mutate(data, {
              onSuccess: (location) => {
                navigate(`/locations/${location.id}`);
              },
            });
          }}
          isSubmitting={createMutation.isPending}
          error={formatMutationError(createMutation.error)}
        />
      </div>
    </div>
  );
}
