import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useRoutes } from '@/features/routes/api/get-routes';
import { useDeleteAllRoutes } from '@/features/routes/api/delete-all-routes';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { Spinner } from '@/components/ui/spinner';

interface RoutesListProps {
  raceId: number;
}

export function RoutesList({ raceId }: RoutesListProps) {
  const { data: routes, isLoading, isError } = useRoutes(raceId);
  const deleteAllMutation = useDeleteAllRoutes(raceId);
  const [showDeleteAll, setShowDeleteAll] = useState(false);

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

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
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
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {routes.map((route) => (
              <tr key={route.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {route.name || `Route #${route.id}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {route.distance} {route.distance_unit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {route.leg_count} / {route.target_leg_count}
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
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          id="delete-all-routes-btn"
          type="button"
          onClick={() => setShowDeleteAll(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Delete All Routes
        </button>
      </div>

      <Modal
        open={showDeleteAll}
        onClose={() => setShowDeleteAll(false)}
        title="Delete All Routes"
      >
        <p className="text-sm text-gray-500 mb-6">
          Are you sure you want to delete all {routes.length} routes? This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowDeleteAll(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            id="confirm-delete-all-routes-btn"
            type="button"
            onClick={() => {
              deleteAllMutation.mutate(
                { raceId },
                { onSuccess: () => setShowDeleteAll(false) },
              );
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
          >
            Delete All
          </button>
        </div>
      </Modal>
    </>
  );
}
