import { Link } from 'react-router-dom';

import { useRaces } from '@/features/races/api/get-races';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';

export function RacesList() {
  const { data: races, isLoading, isError } = useRaces();

  if (isLoading) {
    return (
      <div className="py-12">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-red-600">Failed to load races.</p>;
  }

  if (!races || races.length === 0) {
    return (
      <EmptyState
        title="No races"
        description="Create a race to get started."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stops
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Distance Range
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Routes
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {races.map((race) => (
            <tr key={race.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {race.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {race.num_stops}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {race.min_total_distance}&ndash;{race.max_total_distance} {race.distance_unit}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {race.route_count}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <Link
                  to={`/races/${race.id}`}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
