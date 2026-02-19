import { useState, type FormEvent } from 'react';

import type { RouteDetail as RouteDetailType } from '@/types/api';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RouteMap } from '@/features/routes/components/route-map';
import { useUpdateRoute } from '@/features/routes/api/update-route';

interface RouteDetailProps {
  route: RouteDetailType;
  raceId: number;
}

export function RouteDetail({ route, raceId }: RouteDetailProps) {
  const [name, setName] = useState(route.name ?? '');
  const updateRoute = useUpdateRoute();

  const handleSaveName = (e: FormEvent) => {
    e.preventDefault();
    updateRoute.mutate({ raceId, routeId: route.id, data: { name } });
  };

  const handleExportCsv = () => {
    const blob = new Blob([route.csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `route-${route.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = async () => {
    const res = await fetch(
      `/api/v1/races/${raceId}/routes/${route.id}/export_pdf`,
    );
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `route-${route.id}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 id="route-name" className="text-lg font-semibold text-gray-900">
              {route.name || `Route #${route.id}`}
            </h2>
            <div className="flex gap-2">
              <Button id="route-download-pdf-btn" variant="secondary" size="sm" onClick={handleExportPdf}>
                Download PDF
              </Button>
              <Button variant="secondary" size="sm" onClick={handleExportCsv}>
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <form id="route-name-form" onSubmit={handleSaveName} className="flex items-end gap-3 mb-6">
            <div className="flex-1">
              <Input
                id="route-name-input"
                label="Route Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter a name for this route"
              />
            </div>
            <Button id="route-save-btn" type="submit" size="sm" loading={updateRoute.isPending}>
              Save
            </Button>
          </form>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Total Distance</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {route.distance} {route.distance_unit}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Legs</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {route.leg_count} / {route.target_leg_count}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Complete</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {route.complete ? 'Yes' : 'No'}
              </dd>
            </div>
          </dl>

          {route.legs.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Legs</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        #
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        From
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        To
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Distance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {route.legs.map((leg, index) => (
                      <tr key={leg.id}>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {leg.start.name}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {leg.finish.name}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {leg.distance_display}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <RouteMap mapUrl={route.map_url} />
    </div>
  );
}
