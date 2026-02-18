import { useNavigate } from 'react-router-dom';
import { RaceForm } from '@/features/races/components/race-form';
import { useCreateRace } from '@/features/races/api/create-race';

export function NewRaceRoute() {
  const navigate = useNavigate();
  const createMutation = useCreateRace();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Race</h1>
      <div className="max-w-2xl">
        <RaceForm
          onSubmit={(data) => {
            createMutation.mutate(data, {
              onSuccess: (race) => {
                navigate(`/races/${race.id}`);
              },
            });
          }}
          isSubmitting={createMutation.isPending}
        />
      </div>
    </div>
  );
}
