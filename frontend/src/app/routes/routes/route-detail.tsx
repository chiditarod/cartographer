import { useParams, Link } from 'react-router-dom';
import { useRoute } from '@/features/routes/api/get-route';
import { RouteDetail as RouteDetailComponent } from '@/features/routes/components/route-detail';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export function RouteDetailRoute() {
  const { raceId, id } = useParams<{ raceId: string; id: string }>();
  const { data: route, isLoading } = useRoute(Number(raceId), Number(id));

  if (isLoading) return <Spinner />;
  if (!route) return <p>Route not found</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Route {route.name || `#${route.id}`}
        </h1>
        <Link to={`/races/${raceId}/routes`}>
          <Button variant="secondary">Back to Routes</Button>
        </Link>
      </div>
      <RouteDetailComponent route={route} raceId={Number(raceId)} />
    </div>
  );
}
