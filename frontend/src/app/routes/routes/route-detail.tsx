import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useRoute } from '@/features/routes/api/get-route';
import { useDeleteRoute } from '@/features/routes/api/delete-route';
import { RouteDetail as RouteDetailComponent } from '@/features/routes/components/route-detail';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Modal } from '@/components/ui/modal';

export function RouteDetailRoute() {
  const { raceId: raceIdParam, id } = useParams<{ raceId: string; id: string }>();
  const raceId = Number(raceIdParam);
  const routeId = Number(id);
  const navigate = useNavigate();
  const { data: route, isLoading } = useRoute(raceId, routeId);
  const deleteMutation = useDeleteRoute(raceId);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (isLoading) return <Spinner />;
  if (!route) return <p>Route not found</p>;

  return (
    <div>
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Route"
      >
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to delete <strong>{route.name || `Route #${route.id}`}</strong>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            id="confirm-delete-route"
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => {
              deleteMutation.mutate({ raceId, routeId }, {
                onSuccess: () => navigate(`/races/${raceIdParam}`),
              });
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {route.name || `Route #${route.id}`}
        </h1>
        <div className="flex gap-2">
          <Link to={`/races/${raceIdParam}`} id="back-to-race-link">
            <Button variant="secondary">Back to Race</Button>
          </Link>
          <Button
            id="delete-route-btn"
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete
          </Button>
        </div>
      </div>
      <RouteDetailComponent route={route} raceId={raceId} />
    </div>
  );
}
