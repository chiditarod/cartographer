import { useParams, useNavigate } from 'react-router-dom';
import { useRace } from '@/features/races/api/get-race';
import { useUpdateRace } from '@/features/races/api/update-race';
import { RaceForm } from '@/features/races/components/race-form';
import { Spinner } from '@/components/ui/spinner';
import { formatMutationError } from '@/utils/format';

export function EditRaceRoute() {
  const { id } = useParams<{ id: string }>();
  const raceId = Number(id);
  const navigate = useNavigate();
  const { data: race, isLoading } = useRace(raceId);
  const updateMutation = useUpdateRace();

  if (isLoading) return <Spinner />;
  if (!race) return <p>Race not found</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Race</h1>
      <div className="max-w-2xl">
        <RaceForm
          initialData={race}
          onSubmit={(data) => {
            updateMutation.mutate(
              { id: raceId, data },
              { onSuccess: () => navigate(`/races/${id}`) },
            );
          }}
          isSubmitting={updateMutation.isPending}
          error={formatMutationError(updateMutation.error)}
        />
      </div>
    </div>
  );
}
