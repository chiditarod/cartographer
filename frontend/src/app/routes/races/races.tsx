import { Link } from 'react-router-dom';
import { RacesList } from '@/features/races/components/races-list';
import { Button } from '@/components/ui/button';

export function RacesRoute() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Races</h1>
        <Link to="/races/new" id="new-race-link">
          <Button>New Race</Button>
        </Link>
      </div>
      <RacesList />
    </div>
  );
}
