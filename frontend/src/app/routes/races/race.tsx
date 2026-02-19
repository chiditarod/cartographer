import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useRace } from '@/features/races/api/get-race';
import { useDeleteRace } from '@/features/races/api/delete-race';
import { useDuplicateRace } from '@/features/races/api/duplicate-race';
import { useDeleteSelectedRoutes } from '@/features/routes/api/delete-selected-routes';
import { useBulkSelectRoutes } from '@/features/routes/api/bulk-select-routes';
import { RaceDetail } from '@/features/races/components/race-detail';
import { SelectionFrequencyMatrix } from '@/features/races/components/selection-frequency-matrix';
import { OperationPanel } from '@/features/operations/components/operation-panel';
import { RoutesList } from '@/features/routes/components/routes-list';
import { useRoutes } from '@/features/routes/api/get-routes';
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
  const { data: routes } = useRoutes(raceId);
  const deleteMutation = useDeleteRace();
  const duplicateMutation = useDuplicateRace();
  const deleteSelectedMutation = useDeleteSelectedRoutes(raceId);
  const bulkSelectMutation = useBulkSelectRoutes(raceId);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteSelectedModal, setShowDeleteSelectedModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [selectedRouteIds, setSelectedRouteIds] = useState<Set<number>>(new Set());
  const [proportionalPaths, setProportionalPaths] = useState(false);
  const initializedFromApi = useRef(false);

  // Reset initialization flag when navigating to a different race
  useEffect(() => {
    initializedFromApi.current = false;
  }, [raceId]);

  // Initialize selectedRouteIds from API data on first load
  useEffect(() => {
    if (routes && !initializedFromApi.current) {
      const persisted = new Set(routes.filter((r) => r.selected).map((r) => r.id));
      setSelectedRouteIds(persisted);
      initializedFromApi.current = true;
    }
  }, [routes]);

  const persistSelection = (ids: Set<number>) => {
    setSelectedRouteIds(ids);
    bulkSelectMutation.mutate({ raceId, ids: [...ids] });
  };

  if (isLoading) return <Spinner />;
  if (!race) return <p>Race not found</p>;

  const locationColorMap = race.locations ? buildLocationColorMap(race.locations) : new Map();
  const selectionCount = selectedRouteIds.size;

  const handleExportPdf = () => {
    const url = selectionCount > 0
      ? `/api/v1/races/${raceId}/routes/export_pdf?ids=${[...selectedRouteIds].join(',')}`
      : `/api/v1/races/${raceId}/routes/export_pdf`;
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `race-${raceId}-routes.pdf`;
        link.click();
        URL.revokeObjectURL(blobUrl);
      });
  };

  const handleExportCsv = () => {
    const url = selectionCount > 0
      ? `/api/v1/races/${raceId}/routes/export_csv?ids=${[...selectedRouteIds].join(',')}`
      : `/api/v1/races/${raceId}/routes/export_csv`;
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `race-${raceId}-routes.csv`;
        link.click();
        URL.revokeObjectURL(blobUrl);
      });
  };

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

      <Modal
        open={showDeleteSelectedModal}
        onClose={() => setShowDeleteSelectedModal(false)}
        title="Delete Selected Routes"
      >
        <p id="delete-selected-modal-body" className="text-sm text-gray-600 mb-4">
          Are you sure you want to delete {selectionCount} selected route{selectionCount !== 1 ? 's' : ''}? This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteSelectedModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleteSelectedMutation.isPending}
            id="confirm-delete-selected-routes-btn"
            onClick={() => {
              deleteSelectedMutation.mutate(
                { raceId, ids: [...selectedRouteIds] },
                {
                  onSuccess: () => {
                    setShowDeleteSelectedModal(false);
                    setSelectedRouteIds(new Set());
                    // No need to persist — the routes themselves are deleted
                    setNotification(`Deleted ${selectionCount} route${selectionCount !== 1 ? 's' : ''}.`);
                  },
                },
              );
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {race.logo_url && (
            <img
              src={race.logo_url}
              alt=""
              className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
            />
          )}
          <h1 id="race-page-title" className="text-2xl font-bold text-gray-900">{race.name}</h1>
        </div>
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
        <RaceDetail race={race} locationColorMap={locationColorMap} routes={routes} />

        <OperationPanel
          raceId={raceId}
          onJobComplete={() => {
            queryClient.invalidateQueries({ queryKey: ['race', raceId] });
            queryClient.invalidateQueries({ queryKey: ['routes', raceId] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            setNotification('Operation completed successfully.');
          }}
          onAutoSelect={(routeIds) => {
            setSelectedRouteIds(new Set(routeIds));
            // auto_select endpoint already persists selection to DB
          }}
        />

        {selectedRouteIds.size > 0 && routes && (
          <SelectionFrequencyMatrix
            race={race}
            routes={routes}
            selectedRouteIds={selectedRouteIds}
            locationColorMap={locationColorMap}
          />
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Complete Routes</h2>
              <button
                id="toggle-proportional-paths"
                type="button"
                onClick={() => setProportionalPaths((v) => !v)}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${proportionalPaths ? 'bg-indigo-600' : 'bg-gray-200'}`}
                role="switch"
                aria-checked={proportionalPaths}
                aria-label="Show proportional distances"
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${proportionalPaths ? 'translate-x-4' : 'translate-x-0'}`}
                />
              </button>
              <span className="text-xs text-gray-500">Distance view</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={selectionCount === 0}
                onClick={handleExportPdf}
                id="download-pdf-btn"
              >
                {selectionCount > 0 ? `Download PDF (${selectionCount})` : 'Download PDF'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportCsv}
                id="export-csv-btn"
              >
                {selectionCount > 0 ? `Export CSV (${selectionCount})` : 'Export CSV'}
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={selectionCount === 0}
                onClick={() => setShowDeleteSelectedModal(true)}
                id="delete-selected-routes-btn"
              >
                {selectionCount > 0 ? `Delete (${selectionCount})` : 'Delete'}
              </Button>
            </div>
          </div>
          <RoutesList
            raceId={raceId}
            locationColorMap={locationColorMap}
            selectedIds={selectedRouteIds}
            onSelectionChange={persistSelection}
            proportionalPaths={proportionalPaths}
          />
        </div>
      </div>
    </div>
  );
}
