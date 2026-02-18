import { useState, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { JobProgress } from '@/features/operations/components/job-progress';
import { useGenerateLegs } from '@/features/operations/api/generate-legs';
import { useGenerateRoutes } from '@/features/operations/api/generate-routes';
import { useGeocodeLocations } from '@/features/operations/api/geocode-locations';
import { useJobPoller } from '@/hooks/use-job-poller';
import { useRace } from '@/features/races/api/get-race';

interface OperationPanelProps {
  raceId: number;
  onJobComplete?: () => void;
}

export function OperationPanel({ raceId, onJobComplete }: OperationPanelProps) {
  const [mockMode, setMockMode] = useState(false);
  const { data: race } = useRace(raceId);

  const generateLegs = useGenerateLegs();
  const generateRoutes = useGenerateRoutes();
  const geocodeLocations = useGeocodeLocations();

  const legsPoller = useJobPoller();
  const routesPoller = useJobPoller();
  const geocodePoller = useJobPoller();

  const isAnyRunning =
    legsPoller.isPolling || routesPoller.isPolling || geocodePoller.isPolling;

  const handleGenerateLegs = useCallback(() => {
    legsPoller.reset();
    generateLegs.mutate(
      { raceId, mock: mockMode },
      {
        onSuccess: (data) => {
          legsPoller.startPolling(data.job_status_id);
        },
      },
    );
  }, [raceId, mockMode, generateLegs, legsPoller]);

  const handleGenerateRoutes = useCallback(() => {
    routesPoller.reset();
    generateRoutes.mutate(raceId, {
      onSuccess: (data) => {
        routesPoller.startPolling(data.job_status_id);
      },
    });
  }, [raceId, generateRoutes, routesPoller]);

  const handleGeocodeLocations = useCallback(() => {
    if (!race) return;
    geocodePoller.reset();
    geocodeLocations.mutate(race.location_ids, {
      onSuccess: (data) => {
        geocodePoller.startPolling(data.job_status_id);
      },
    });
  }, [race, geocodeLocations, geocodePoller]);

  // Fire the onJobComplete callback when any poller finishes successfully
  const checkComplete = useCallback(() => {
    const pollers = [legsPoller, routesPoller, geocodePoller];
    for (const poller of pollers) {
      if (
        poller.jobStatus &&
        poller.jobStatus.status === 'completed' &&
        !poller.isPolling
      ) {
        onJobComplete?.();
        return;
      }
    }
  }, [legsPoller, routesPoller, geocodePoller, onJobComplete]);

  // Check after each render cycle
  checkComplete();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Operations</h3>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
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
              onClick={handleGenerateLegs}
              loading={generateLegs.isPending}
              disabled={isAnyRunning}
            >
              Generate Legs
            </Button>
            <Button
              onClick={handleGenerateRoutes}
              loading={generateRoutes.isPending}
              disabled={isAnyRunning}
            >
              Generate Routes
            </Button>
            <Button
              onClick={handleGeocodeLocations}
              loading={geocodeLocations.isPending}
              disabled={isAnyRunning || !race}
            >
              Geocode Locations
            </Button>
          </div>

          {(legsPoller.jobStatus || legsPoller.isPolling) && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Generate Legs</p>
              <JobProgress
                jobStatus={legsPoller.jobStatus}
                isPolling={legsPoller.isPolling}
              />
            </div>
          )}

          {(routesPoller.jobStatus || routesPoller.isPolling) && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Generate Routes</p>
              <JobProgress
                jobStatus={routesPoller.jobStatus}
                isPolling={routesPoller.isPolling}
              />
            </div>
          )}

          {(geocodePoller.jobStatus || geocodePoller.isPolling) && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Geocode Locations</p>
              <JobProgress
                jobStatus={geocodePoller.jobStatus}
                isPolling={geocodePoller.isPolling}
              />
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
