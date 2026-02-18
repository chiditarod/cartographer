import { useParams, useNavigate } from 'react-router-dom';
import { useLocation } from '@/features/locations/api/get-location';
import { useUpdateLocation } from '@/features/locations/api/update-location';
import { LocationForm } from '@/features/locations/components/location-form';
import { Spinner } from '@/components/ui/spinner';
import { formatMutationError } from '@/utils/format';

export function EditLocationRoute() {
  const { id } = useParams<{ id: string }>();
  const locationId = Number(id);
  const navigate = useNavigate();
  const { data: location, isLoading } = useLocation(locationId);
  const updateMutation = useUpdateLocation();

  if (isLoading) return <Spinner />;
  if (!location) return <p>Location not found</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Location</h1>
      <div className="max-w-2xl">
        <LocationForm
          initialData={location}
          onSubmit={(data) => {
            updateMutation.mutate(
              { id: locationId, data },
              { onSuccess: () => navigate(`/locations/${id}`) },
            );
          }}
          isSubmitting={updateMutation.isPending}
          error={formatMutationError(updateMutation.error)}
        />
      </div>
    </div>
  );
}
