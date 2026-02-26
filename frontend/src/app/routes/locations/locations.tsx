import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { LocationsList } from '@/features/locations/components/locations-list';
import { Button } from '@/components/ui/button';
import { JobProgress } from '@/features/operations/components/job-progress';
import { useGeocodeLocations } from '@/features/operations/api/geocode-locations';
import { useLocations } from '@/features/locations/api/get-locations';
import { useJobPoller } from '@/hooks/use-job-poller';

export function LocationsRoute() {
  const queryClient = useQueryClient();
  const { data: locations } = useLocations();
  const geocodeLocations = useGeocodeLocations();
  const geocodePoller = useJobPoller();
  const completedRef = useRef(false);

  const handleGeocode = () => {
    if (!locations || locations.length === 0) return;
    completedRef.current = false;
    geocodePoller.reset();
    const locationIds = locations.map((l) => l.id);
    geocodeLocations.mutate(locationIds, {
      onSuccess: (data) => {
        geocodePoller.startPolling(data.job_status_id);
      },
    });
  };

  // Invalidate locations query when geocode completes
  useEffect(() => {
    if (
      geocodePoller.jobStatus &&
      geocodePoller.jobStatus.status === 'completed' &&
      !geocodePoller.isPolling &&
      !completedRef.current
    ) {
      completedRef.current = true;
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    }
  }, [geocodePoller.jobStatus, geocodePoller.isPolling, queryClient]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
        <div className="flex gap-2">
          <Button
            id="btn-geocode"
            variant="secondary"
            onClick={handleGeocode}
            loading={geocodeLocations.isPending}
            disabled={geocodePoller.isPolling || !locations || locations.length === 0}
            title="Add GPS coordinates to all locations"
          >
            Geocode All
          </Button>
          <Link to="/locations/new" id="new-location-link">
            <Button>New Location</Button>
          </Link>
        </div>
      </div>

      {(geocodePoller.jobStatus || geocodePoller.isPolling) && (
        <div data-testid="op-geocode-progress" className="mb-4">
          <JobProgress
            jobStatus={geocodePoller.jobStatus}
            isPolling={geocodePoller.isPolling}
          />
        </div>
      )}

      <LocationsList />
    </div>
  );
}
