import type { Race, RouteSummary } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { heatColor, buildPositionUsage, buildColBounds } from '../utils/checkpoint-frequency';

interface SelectionFrequencyMatrixProps {
  race: Race;
  routes: RouteSummary[];
  selectedRouteIds: Set<number>;
  locationColorMap: Map<number, string>;
}

export function SelectionFrequencyMatrix({
  race,
  routes,
  selectedRouteIds,
  locationColorMap,
}: SelectionFrequencyMatrixProps) {
  const filteredRoutes = routes.filter((r) => selectedRouteIds.has(r.id) && !r.custom);
  const positionUsage = buildPositionUsage(filteredRoutes);
  const numCPs = race.num_stops;
  const colBounds = buildColBounds(positionUsage, numCPs);

  if (positionUsage.size === 0) return null;

  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50 overflow-hidden transition-all duration-300 ease-in-out">
      <div className="px-5 py-3">
        <h3 className="text-xs font-medium text-indigo-600 mb-2">
          Selection Frequency — {filteredRoutes.length} route{filteredRoutes.length !== 1 ? 's' : ''}
        </h3>
        <div className="overflow-x-auto max-h-[40vh] overflow-y-auto">
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
                ?.filter((loc) => positionUsage.has(loc.id))
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
    </div>
  );
}
