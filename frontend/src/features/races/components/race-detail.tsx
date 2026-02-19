import type { Race, RouteSummary } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { heatColor, buildPositionUsage, buildColBounds } from '../utils/checkpoint-frequency';

interface RaceDetailProps {
  race: Race;
  locationColorMap: Map<number, string>;
  routes?: RouteSummary[];
}

export function RaceDetail({ race, locationColorMap, routes }: RaceDetailProps) {
  const positionUsage = routes ? buildPositionUsage(routes) : new Map<number, Map<number, number>>();
  const numCPs = race.num_stops;
  const colBounds = buildColBounds(positionUsage, numCPs);

  const stats: { label: string; value: string | number }[] = [
    { label: 'Stops', value: race.num_stops },
    { label: 'Max Teams', value: race.max_teams },
    { label: 'Per Team', value: race.people_per_team },
    { label: 'Total Dist', value: `${race.min_total_distance}–${race.max_total_distance} ${race.distance_unit}` },
    { label: 'Leg Dist', value: `${race.min_leg_distance}–${race.max_leg_distance} ${race.distance_unit}` },
  ];

  if (race.start) stats.push({ label: 'Start', value: race.start.name });
  if (race.finish) stats.push({ label: 'Finish', value: race.finish.name });
  if (race.leg_count != null) stats.push({ label: 'Legs', value: race.leg_count });
  stats.push({ label: 'Routes', value: race.route_count });

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-l-4 border-indigo-400 px-5 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {stats.map((stat, i) => (
            <span key={stat.label} className="flex items-center gap-x-4">
              {i > 0 && (
                <span className="text-gray-300" aria-hidden="true">|</span>
              )}
              <span className="text-xs text-gray-500">{stat.label}</span>
              <span className="text-sm font-semibold text-gray-900">{stat.value}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {race.locations && race.locations.length > 0 && (
          <div id="location-pool-section">
            <h3 className="text-xs font-medium text-gray-500 mb-1.5">Location Pool</h3>
            <div className="flex flex-wrap gap-1.5">
              {race.locations.map((loc) => (
                <Badge key={loc.id} colorClasses={locationColorMap.get(loc.id)}>
                  {loc.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {race.locations && race.locations.length > 0 && positionUsage.size > 0 && (
          <div>
            <h3 className="text-xs font-medium text-gray-500 mb-1.5">Checkpoint Position Usage</h3>
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
      </div>
    </div>
  );
}
