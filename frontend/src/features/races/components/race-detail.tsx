import type { Race, RouteSummary } from '@/types/api';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RaceDetailProps {
  race: Race;
  locationColorMap: Map<number, string>;
  routes?: RouteSummary[];
}

function heatColor(value: number, min: number, max: number): string {
  if (min === max) return 'hsl(0, 0%, 92%)';
  const t = (value - min) / (max - min);
  // green (120) at low → yellow (45) at mid → red (0) at high
  const hue = t <= 0.5
    ? 120 - (120 - 45) * (t / 0.5)
    : 45 - 45 * ((t - 0.5) / 0.5);
  const saturation = 40 + 10 * t; // 40% → 50%
  const lightness = 90 - 2 * t;   // 90% → 88%
  return `hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`;
}

export function RaceDetail({ race, locationColorMap, routes }: RaceDetailProps) {
  // Build positionUsage: Map<locationId, Map<cpNumber, count>>
  const positionUsage = new Map<number, Map<number, number>>();
  if (routes) {
    for (const route of routes) {
      const seq = route.location_sequence;
      // Skip index 0 (start) and last index (finish), only count intermediate checkpoints
      for (let i = 1; i < seq.length - 1; i++) {
        const loc = seq[i];
        const cpNumber = i; // checkpoint position (1-based)
        if (!positionUsage.has(loc.id)) {
          positionUsage.set(loc.id, new Map());
        }
        const locMap = positionUsage.get(loc.id)!;
        locMap.set(cpNumber, (locMap.get(cpNumber) || 0) + 1);
      }
    }
  }

  // Precompute per-column min/max bounds
  const numCPs = race.num_stops;
  const colBounds = new Map<number, { min: number; max: number }>();
  for (let cp = 1; cp <= numCPs; cp++) {
    let min = Infinity;
    let max = -Infinity;
    for (const [, locMap] of positionUsage) {
      const count = locMap.get(cp) || 0;
      if (count < min) min = count;
      if (count > max) max = count;
    }
    // If no data, set both to 0
    if (min === Infinity) min = 0;
    if (max === -Infinity) max = 0;
    colBounds.set(cp, { min, max });
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

        {race.locations && race.locations.length > 0 && positionUsage.size > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Checkpoint Position Usage</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-gray-500 font-medium text-left pr-4 py-1">Location</th>
                    {Array.from({ length: numCPs }, (_, i) => (
                      <th key={i + 1} className="text-gray-500 font-medium px-3 py-1 text-center">
                        CP {i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {race.locations
                    .filter((loc) => positionUsage.has(loc.id))
                    .map((loc) => {
                      const locMap = positionUsage.get(loc.id)!;
                      return (
                        <tr key={loc.id}>
                          <td className="pr-4 py-1">
                            <Badge colorClasses={locationColorMap.get(loc.id)}>
                              {loc.name}
                            </Badge>
                          </td>
                          {Array.from({ length: numCPs }, (_, i) => {
                            const cp = i + 1;
                            const count = locMap.get(cp) || 0;
                            const bounds = colBounds.get(cp)!;
                            return (
                              <td
                                key={cp}
                                className="px-3 py-1 text-center font-mono rounded"
                                style={{ backgroundColor: heatColor(count, bounds.min, bounds.max) }}
                              >
                                {count}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
