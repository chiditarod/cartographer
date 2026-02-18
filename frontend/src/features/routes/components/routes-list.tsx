import React from 'react';
import { Link } from 'react-router-dom';

import { useRoutes } from '@/features/routes/api/get-routes';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { abbreviateLocation } from '@/utils/location';

interface RoutesListProps {
  raceId: number;
  locationColorMap?: Map<number, string>;
  selectedIds?: Set<number>;
  onSelectionChange?: (ids: Set<number>) => void;
}

export function RoutesList({ raceId, locationColorMap, selectedIds, onSelectionChange }: RoutesListProps) {
  const { data: routes, isLoading, isError } = useRoutes(raceId);

  if (isLoading) {
    return (
      <div className="py-12">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-red-600">Failed to load routes.</p>;
  }

  if (!routes || routes.length === 0) {
    return (
      <EmptyState
        title="No routes"
        description="Generate routes to see them here."
      />
    );
  }

  const selectable = selectedIds !== undefined && onSelectionChange !== undefined;
  const allSelected = selectable && routes.length > 0 && routes.every((r) => selectedIds.has(r.id));
  const colSpan = selectable ? 6 : 5;

  const toggleRoute = (id: number) => {
    if (!onSelectionChange || !selectedIds) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  };

  const toggleAll = () => {
    if (!onSelectionChange || !routes) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(routes.map((r) => r.id)));
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {selectable && (
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  data-testid="select-all-routes"
                />
              </th>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Distance
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Legs
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rarity
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {routes.map((route) => (
            <React.Fragment key={route.id}>
              <tr>
                {selectable && (
                  <td className="w-10 px-3 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(route.id)}
                      onChange={() => toggleRoute(route.id)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      data-testid={`select-route-${route.id}`}
                    />
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {route.name || `Route #${route.id}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {route.distance} {route.distance_unit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {route.leg_count} / {route.target_leg_count}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {route.rarity_score !== null ? route.rarity_score : '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link
                    to={`/races/${raceId}/routes/${route.id}`}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    View
                  </Link>
                </td>
              </tr>
              {route.location_sequence.length > 0 && (
                <tr>
                  <td colSpan={colSpan} className="px-6 pb-4 pt-0">
                    <div className="flex flex-wrap items-center gap-1">
                      {route.location_sequence.map((loc, i) => (
                        <React.Fragment key={`${route.id}-loc-${i}`}>
                          {i > 0 && (
                            <span className="text-gray-400 text-xs mx-0.5">&rarr;</span>
                          )}
                          <Badge
                            colorClasses={locationColorMap?.get(loc.id)}
                          >
                            {abbreviateLocation(loc.name)}
                          </Badge>
                        </React.Fragment>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
