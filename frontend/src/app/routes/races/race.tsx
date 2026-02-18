import { useParams, useNavigate, Link } from 'react-router-dom';
import { useRace } from '@/features/races/api/get-race';
import { useDeleteRace } from '@/features/races/api/delete-race';
import { RaceDetail } from '@/features/races/components/race-detail';
import { OperationPanel } from '@/features/operations/components/operation-panel';
import { RoutesList } from '@/features/routes/components/routes-list';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useQueryClient } from '@tanstack/react-query';

export function RaceRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: race, isLoading } = useRace(Number(id));
  const deleteMutation = useDeleteRace();

  if (isLoading) return <Spinner />;
  if (!race) return <p>Race not found</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{race.name}</h1>
        <div className="flex gap-2">
          <Link to={`/races/${id}/edit`}>
            <Button variant="secondary">Edit</Button>
          </Link>
          <Button
            variant="danger"
            onClick={() => {
              if (confirm('Delete this race and all its routes?')) {
                deleteMutation.mutate(Number(id), {
                  onSuccess: () => navigate('/races'),
                });
              }
            }}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <RaceDetail race={race} />

        <OperationPanel
          raceId={Number(id)}
          onJobComplete={() => {
            queryClient.invalidateQueries({ queryKey: ['race', Number(id)] });
            queryClient.invalidateQueries({ queryKey: ['routes', Number(id)] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
          }}
        />

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Complete Routes</h2>
            <Link to={`/races/${id}/routes`}>
              <Button variant="secondary" size="sm">View All Routes</Button>
            </Link>
          </div>
          <RoutesList raceId={Number(id)} />
        </div>
      </div>
    </div>
  );
}
