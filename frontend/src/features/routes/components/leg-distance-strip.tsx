import { Badge } from '@/components/ui/badge';
import { abbreviateLocation, buildLocationColorMap } from '@/utils/location';
import type { RouteDetail } from '@/types/api';

interface LegDistanceStripProps {
  route: RouteDetail;
}

const MIN_FLEX = 1;
const FLEX_SCALE = 10;

export function LegDistanceStrip({ route }: LegDistanceStripProps) {
  const { location_sequence, legs } = route;

  if (legs.length === 0 || location_sequence.length < 2) return null;

  const colorMap = buildLocationColorMap(location_sequence);
  const maxDistance = Math.max(...legs.map((l) => l.distance));

  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Route Path</h3>
      <div className="flex items-center w-full py-2">
        {location_sequence.map((loc, i) => {
          const leg = i < legs.length ? legs[i] : null;
          const flexValue = leg
            ? Math.max(MIN_FLEX, (leg.distance / maxDistance) * FLEX_SCALE)
            : 0;

          return (
            <div
              key={`strip-${loc.id}-${i}`}
              className="flex items-center min-w-0"
              style={leg ? { flex: `${flexValue} 1 0%` } : undefined}
            >
              <Badge colorClasses={colorMap.get(loc.id)}>
                {abbreviateLocation(loc.name)}
              </Badge>

              {leg && (
                <div className="flex flex-col items-center mx-1 min-w-0 flex-1">
                  <div className="w-full flex items-center">
                    <div className="flex-1 border-t-2 border-gray-300" />
                    <svg
                      width="8"
                      height="10"
                      viewBox="0 0 8 10"
                      className="text-gray-300 flex-shrink-0"
                    >
                      <path d="M0 0 L8 5 L0 10 Z" fill="currentColor" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-500 mt-0.5 whitespace-nowrap">
                    {leg.distance_display}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
