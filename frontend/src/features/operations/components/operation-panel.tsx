import { useState, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { JobProgress } from '@/features/operations/components/job-progress';
import { useGenerateLegs } from '@/features/operations/api/generate-legs';
import { useGenerateRoutes } from '@/features/operations/api/generate-routes';
import { useGeocodeLocations } from '@/features/operations/api/geocode-locations';
import { useRankRoutes } from '@/features/operations/api/rank-routes';
import { useAutoSelectRoutes } from '@/features/operations/api/auto-select';
import { AutoSelectModal } from '@/features/operations/components/auto-select-modal';
import { useDeleteAllRoutes } from '@/features/routes/api/delete-all-routes';
import { useRoutes } from '@/features/routes/api/get-routes';
import { useJobPoller } from '@/hooks/use-job-poller';
import { useRace } from '@/features/races/api/get-race';

interface OperationPanelProps {
  raceId: number;
  onJobComplete?: () => void;
  onAutoSelect?: (routeIds: number[]) => void;
}

export function OperationPanel({ raceId, onJobComplete, onAutoSelect }: OperationPanelProps) {
  const [mockMode, setMockMode] = useState(false);
  const [showDeleteAllRoutes, setShowDeleteAllRoutes] = useState(false);
  const { data: race } = useRace(raceId);
  const { data: routes } = useRoutes(raceId);
  const deleteAllRoutes = useDeleteAllRoutes(raceId);

  const generateLegs = useGenerateLegs();
  const generateRoutes = useGenerateRoutes();
  const geocodeLocations = useGeocodeLocations();
  const rankRoutes = useRankRoutes();
  const autoSelect = useAutoSelectRoutes();
  const [showAutoSelect, setShowAutoSelect] = useState(false);

  const legsPoller = useJobPoller();
  const routesPoller = useJobPoller();
  const geocodePoller = useJobPoller();
  const rankPoller = useJobPoller();

  const isAnyRunning =
    legsPoller.isPolling || routesPoller.isPolling || geocodePoller.isPolling || rankPoller.isPolling;

  // Track which jobs have already triggered onJobComplete to prevent repeated calls
  const completedJobsRef = useRef<Set<number>>(new Set());

  const handleGenerateLegs = () => {
    legsPoller.reset();
    generateLegs.mutate(
      { raceId, mock: mockMode },
      {
        onSuccess: (data) => {
          legsPoller.startPolling(data.job_status_id);
        },
      },
    );
  };

  const handleGenerateRoutes = () => {
    routesPoller.reset();
    generateRoutes.mutate(raceId, {
      onSuccess: (data) => {
        routesPoller.startPolling(data.job_status_id);
      },
    });
  };

  const handleGeocodeLocations = () => {
    if (!race) return;
    geocodePoller.reset();
    geocodeLocations.mutate(race.location_ids, {
      onSuccess: (data) => {
        geocodePoller.startPolling(data.job_status_id);
      },
    });
  };

  const handleRankRoutes = () => {
    rankPoller.reset();
    rankRoutes.mutate(raceId, {
      onSuccess: (data) => {
        rankPoller.startPolling(data.job_status_id);
      },
    });
  };

  const handleAutoSelect = (count: number) => {
    autoSelect.mutate(
      { raceId, count },
      {
        onSuccess: (data) => {
          onAutoSelect?.(data.route_ids);
          setShowAutoSelect(false);
        },
      },
    );
  };

  const completeRouteCount = routes?.filter((r) => r.complete).length ?? 0;

  // Fire onJobComplete when any poller finishes - properly in useEffect, not render body
  useEffect(() => {
    const pollers = [legsPoller, routesPoller, geocodePoller, rankPoller];
    for (const poller of pollers) {
      if (
        poller.jobStatus &&
        poller.jobStatus.status === 'completed' &&
        !poller.isPolling &&
        !completedJobsRef.current.has(poller.jobStatus.id)
      ) {
        completedJobsRef.current.add(poller.jobStatus.id);
        onJobComplete?.();
        return;
      }
    }
  }, [legsPoller.jobStatus, routesPoller.jobStatus, geocodePoller.jobStatus, rankPoller.jobStatus, legsPoller.isPolling, routesPoller.isPolling, geocodePoller.isPolling, rankPoller.isPolling, onJobComplete]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Operations</h3>
          <label htmlFor="mock-mode-checkbox" className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              id="mock-mode-checkbox"
              type="checkbox"
              checked={mockMode}
              onChange={(e) => setMockMode(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Mock mode
          </label>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              id="btn-geocode"
              onClick={handleGeocodeLocations}
              loading={geocodeLocations.isPending}
              disabled={isAnyRunning || !race}
            >
              Geocode Locations
            </Button>
            <Button
              id="btn-generate-legs"
              onClick={handleGenerateLegs}
              loading={generateLegs.isPending}
              disabled={isAnyRunning}
            >
              Generate Legs
            </Button>
            <Button
              id="btn-generate-routes"
              onClick={handleGenerateRoutes}
              loading={generateRoutes.isPending}
              disabled={isAnyRunning}
            >
              Generate Routes
            </Button>
            <Button
              id="btn-rank-routes"
              onClick={handleRankRoutes}
              loading={rankRoutes.isPending}
              disabled={isAnyRunning}
            >
              Rank Routes
            </Button>
            <Button
              id="btn-auto-select"
              onClick={() => setShowAutoSelect(true)}
              disabled={isAnyRunning || completeRouteCount === 0}
            >
              Auto-Select
            </Button>
            {routes && routes.length > 0 && (
              <Button
                id="delete-all-routes-btn"
                variant="danger"
                onClick={() => setShowDeleteAllRoutes(true)}
                disabled={isAnyRunning}
              >
                Delete All Routes
              </Button>
            )}
          </div>

          {(legsPoller.jobStatus || legsPoller.isPolling) && (
            <div data-testid="op-generate-legs-progress">
              <p className="text-xs font-medium text-gray-500 mb-1">Generate Legs</p>
              <JobProgress
                jobStatus={legsPoller.jobStatus}
                isPolling={legsPoller.isPolling}
              />
            </div>
          )}

          {(routesPoller.jobStatus || routesPoller.isPolling) && (
            <div data-testid="op-generate-routes-progress">
              <p className="text-xs font-medium text-gray-500 mb-1">Generate Routes</p>
              <JobProgress
                jobStatus={routesPoller.jobStatus}
                isPolling={routesPoller.isPolling}
              />
            </div>
          )}

          {(geocodePoller.jobStatus || geocodePoller.isPolling) && (
            <div data-testid="op-geocode-progress">
              <p className="text-xs font-medium text-gray-500 mb-1">Geocode Locations</p>
              <JobProgress
                jobStatus={geocodePoller.jobStatus}
                isPolling={geocodePoller.isPolling}
              />
            </div>
          )}

          {(rankPoller.jobStatus || rankPoller.isPolling) && (
            <div data-testid="op-rank-routes-progress">
              <p className="text-xs font-medium text-gray-500 mb-1">Rank Routes</p>
              <JobProgress
                jobStatus={rankPoller.jobStatus}
                isPolling={rankPoller.isPolling}
              />
            </div>
          )}
        </div>
      </CardBody>

      <Modal
        open={showDeleteAllRoutes}
        onClose={() => setShowDeleteAllRoutes(false)}
        title="Delete All Routes"
      >
        <p id="delete-all-modal-body" className="text-sm text-gray-500 mb-6">
          Are you sure you want to delete all {routes?.length ?? 0} routes? This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteAllRoutes(false)}>
            Cancel
          </Button>
          <Button
            id="confirm-delete-all-routes-btn"
            variant="danger"
            loading={deleteAllRoutes.isPending}
            onClick={() => {
              deleteAllRoutes.mutate(
                { raceId },
                { onSuccess: () => setShowDeleteAllRoutes(false) },
              );
            }}
          >
            Delete All
          </Button>
        </div>
      </Modal>
      <AutoSelectModal
        open={showAutoSelect}
        onClose={() => {
          setShowAutoSelect(false);
          autoSelect.reset();
        }}
        onSubmit={handleAutoSelect}
        isLoading={autoSelect.isPending}
        maxCount={completeRouteCount}
        error={autoSelect.error?.message}
      />
    </Card>
  );
}
