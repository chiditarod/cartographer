import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLocation } from '@/features/locations/api/get-location';
import { useDeleteLocation } from '@/features/locations/api/delete-location';
import { LocationDetail } from '@/features/locations/components/location-detail';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Modal } from '@/components/ui/modal';

export function LocationRoute() {
  const { id } = useParams<{ id: string }>();
  const locationId = Number(id);
  const navigate = useNavigate();
  const { data: location, isLoading } = useLocation(locationId);
  const deleteMutation = useDeleteLocation();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (isLoading) return <Spinner />;
  if (!location) return <p>Location not found</p>;

  return (
    <div>
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Location"
      >
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to delete <strong>{location.name}</strong>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => {
              deleteMutation.mutate(locationId, {
                onSuccess: () => navigate('/locations'),
              });
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{location.name}</h1>
        <div className="flex gap-2">
          <Link to={`/locations/${id}/edit`} id="edit-location-link">
            <Button variant="secondary">Edit</Button>
          </Link>
          <Button
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete
          </Button>
        </div>
      </div>
      <LocationDetail location={location} />
    </div>
  );
}
