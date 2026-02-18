import { Link } from 'react-router-dom';

import { useLocations } from '@/features/locations/api/get-locations';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';

export function LocationsList() {
  const { data: locations, isLoading, isError } = useLocations();

  if (isLoading) {
    return (
      <div className="py-12">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-red-600">Failed to load locations.</p>;
  }

  if (!locations || locations.length === 0) {
    return (
      <EmptyState
        title="No locations"
        description="Add a location to get started."
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
              Address
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Geocoded
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {locations.map((location) => (
            <tr key={location.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {location.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {location.full_address}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <Badge variant={location.geocoded ? 'success' : 'warning'}>
                  {location.geocoded ? 'Yes' : 'No'}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <Link
                  to={`/locations/${location.id}`}
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
