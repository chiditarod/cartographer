import type { Race, RouteSummary } from '@/types/api';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { abbreviateLocation } from '@/utils/location';

interface RaceDetailProps {
  race: Race;
  locationColorMap: Map<number, string>;
  routes?: RouteSummary[];
}

export function RaceDetail({ race, locationColorMap, routes }: RaceDetailProps) {
  const locationUsage = new Map<number, number>();
  if (routes) {
    for (const route of routes) {
      for (const loc of route.location_sequence) {
        locationUsage.set(loc.id, (locationUsage.get(loc.id) || 0) + 1);
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 id="race-detail-name" className="text-lg font-semibold text-gray-900">{race.name}</h2>
      </CardHeader>
      <CardBody>
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Stops</dt>
            <dd className="mt-1 text-sm text-gray-900">{race.num_stops}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Max Teams</dt>
            <dd className="mt-1 text-sm text-gray-900">{race.max_teams}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">People per Team</dt>
            <dd className="mt-1 text-sm text-gray-900">{race.people_per_team}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Total Distance Range</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {race.min_total_distance}&ndash;{race.max_total_distance} {race.distance_unit}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Leg Distance Range</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {race.min_leg_distance}&ndash;{race.max_leg_distance} {race.distance_unit}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Distance Unit</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {race.distance_unit === 'mi' ? 'Miles' : 'Kilometers'}
            </dd>
          </div>

          {race.start && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Start</dt>
              <dd className="mt-1 text-sm text-gray-900">{race.start.name}</dd>
            </div>
          )}

          {race.finish && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Finish</dt>
              <dd className="mt-1 text-sm text-gray-900">{race.finish.name}</dd>
            </div>
          )}

          {race.leg_count != null && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Legs</dt>
              <dd className="mt-1 text-sm text-gray-900">{race.leg_count}</dd>
            </div>
          )}

          <div>
            <dt className="text-sm font-medium text-gray-500">Routes</dt>
            <dd className="mt-1 text-sm text-gray-900">{race.route_count}</dd>
          </div>
        </dl>

        {race.locations && race.locations.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Location Pool</h3>
            <div className="flex flex-wrap gap-2">
              {race.locations.map((loc) => (
                <Badge key={loc.id} colorClasses={locationColorMap.get(loc.id)}>
                  {loc.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {race.locations && race.locations.length > 0 && locationUsage.size > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Location Usage in Routes</h3>
            <div className="flex flex-wrap gap-2">
              {race.locations.map((loc) => (
                <Badge key={loc.id} colorClasses={locationColorMap.get(loc.id)}>
                  {abbreviateLocation(loc.name)}: {locationUsage.get(loc.id) || 0}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
