import { useParams, Link } from 'react-router-dom';
import { RoutesList } from '@/features/routes/components/routes-list';
import { Button } from '@/components/ui/button';

export function RaceRoutesRoute() {
  const { raceId } = useParams<{ raceId: string }>();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Routes</h1>
        <Link to={`/races/${raceId}`}>
          <Button variant="secondary">Back to Race</Button>
        </Link>
      </div>
      <RoutesList raceId={Number(raceId)} />
    </div>
  );
}
