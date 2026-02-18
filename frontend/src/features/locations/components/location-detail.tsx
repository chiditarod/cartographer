import type { Location } from '@/types/api';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LocationDetailProps {
  location: Location;
}

export function LocationDetail({ location }: LocationDetailProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 id="location-name" className="text-lg font-semibold text-gray-900">{location.name}</h2>
          <Badge variant={location.geocoded ? 'success' : 'warning'}>
            {location.geocoded ? 'Geocoded' : 'Not Geocoded'}
          </Badge>
        </div>
      </CardHeader>
      <CardBody>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Full Address</dt>
            <dd className="mt-1 text-sm text-gray-900">{location.full_address || '-'}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Coordinates</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {location.lat != null && location.lng != null
                ? `${location.lat}, ${location.lng}`
                : '-'}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Max Capacity</dt>
            <dd className="mt-1 text-sm text-gray-900">{location.max_capacity}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Ideal Capacity</dt>
            <dd className="mt-1 text-sm text-gray-900">{location.ideal_capacity}</dd>
          </div>
        </dl>
      </CardBody>
    </Card>
  );
}
