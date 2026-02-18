import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLocation } from '@/features/locations/api/get-location';
import { useDeleteLocation } from '@/features/locations/api/delete-location';
import { LocationDetail } from '@/features/locations/components/location-detail';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export function LocationRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: location, isLoading } = useLocation(Number(id));
  const deleteMutation = useDeleteLocation();

  if (isLoading) return <Spinner />;
  if (!location) return <p>Location not found</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{location.name}</h1>
        <div className="flex gap-2">
          <Link to={`/locations/${id}/edit`}>
            <Button variant="secondary">Edit</Button>
          </Link>
          <Button
            variant="danger"
            onClick={() => {
              if (confirm('Delete this location?')) {
                deleteMutation.mutate(Number(id), {
                  onSuccess: () => navigate('/locations'),
                });
              }
            }}
          >
            Delete
          </Button>
        </div>
      </div>
      <LocationDetail location={location} />
    </div>
  );
}
