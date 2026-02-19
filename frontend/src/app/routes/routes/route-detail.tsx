import { useParams, Link } from 'react-router-dom';
import { useRoute } from '@/features/routes/api/get-route';
import { RouteDetail as RouteDetailComponent } from '@/features/routes/components/route-detail';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export function RouteDetailRoute() {
  const { raceId: raceIdParam, id } = useParams<{ raceId: string; id: string }>();
  const raceId = Number(raceIdParam);
  const routeId = Number(id);
  const { data: route, isLoading } = useRoute(raceId, routeId);

  if (isLoading) return <Spinner />;
  if (!route) return <p>Route not found</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {route.name || `Route #${route.id}`}
        </h1>
        <Link to={`/races/${raceIdParam}`} id="back-to-race-link">
          <Button variant="secondary">Back to Race</Button>
        </Link>
      </div>
      <RouteDetailComponent route={route} raceId={raceId} />
    </div>
  );
}
