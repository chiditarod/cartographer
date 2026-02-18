import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useRace } from '@/features/races/api/get-race';
import { useDeleteRace } from '@/features/races/api/delete-race';
import { useDuplicateRace } from '@/features/races/api/duplicate-race';
import { RaceDetail } from '@/features/races/components/race-detail';
import { OperationPanel } from '@/features/operations/components/operation-panel';
import { RoutesList } from '@/features/routes/components/routes-list';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Modal } from '@/components/ui/modal';
import { Notification } from '@/components/ui/notification';
import { useQueryClient } from '@tanstack/react-query';
import { buildLocationColorMap } from '@/utils/location';

export function RaceRoute() {
  const { id } = useParams<{ id: string }>();
  const raceId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: race, isLoading } = useRace(raceId);
  const deleteMutation = useDeleteRace();
  const duplicateMutation = useDuplicateRace();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  if (isLoading) return <Spinner />;
  if (!race) return <p>Race not found</p>;

  const locationColorMap = race.locations ? buildLocationColorMap(race.locations) : new Map();

  return (
    <div>
      {notification && (
        <Notification
          message={notification}
          onDismiss={() => setNotification(null)}
        />
      )}

      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Race"
      >
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to delete <strong>{race.name}</strong> and all its routes? This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => {
              deleteMutation.mutate(raceId, {
                onSuccess: () => navigate('/races'),
              });
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>

      <div className="flex items-center justify-between mb-6">
        <h1 id="race-page-title" className="text-2xl font-bold text-gray-900">{race.name}</h1>
        <div className="flex gap-2">
          <Link to={`/races/${id}/edit`} id="edit-race-link">
            <Button variant="secondary">Edit</Button>
          </Link>
          <Button
            variant="secondary"
            loading={duplicateMutation.isPending}
            onClick={() => {
              duplicateMutation.mutate(raceId, {
                onSuccess: (newRace) => navigate(`/races/${newRace.id}`),
              });
            }}
          >
            Duplicate
          </Button>
          <Button
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <RaceDetail race={race} locationColorMap={locationColorMap} />

        <OperationPanel
          raceId={raceId}
          onJobComplete={() => {
            queryClient.invalidateQueries({ queryKey: ['race', raceId] });
            queryClient.invalidateQueries({ queryKey: ['routes', raceId] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            setNotification('Operation completed successfully.');
          }}
        />

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Complete Routes</h2>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  fetch(`/api/v1/races/${raceId}/routes/export_csv`)
                    .then((res) => res.blob())
                    .then((blob) => {
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `race-${raceId}-routes.csv`;
                      link.click();
                      URL.revokeObjectURL(url);
                    });
                }}
              >
                Export CSV
              </Button>
              <Link to={`/races/${id}/routes`} id="view-all-routes-link">
                <Button variant="secondary" size="sm">View All Routes</Button>
              </Link>
            </div>
          </div>
          <RoutesList raceId={raceId} locationColorMap={locationColorMap} />
        </div>
      </div>
    </div>
  );
}
