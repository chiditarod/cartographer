import { Link } from 'react-router-dom';
import { LocationsList } from '@/features/locations/components/locations-list';
import { Button } from '@/components/ui/button';

export function LocationsRoute() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
        <Link to="/locations/new" id="new-location-link">
          <Button>New Location</Button>
        </Link>
      </div>
      <LocationsList />
    </div>
  );
}
