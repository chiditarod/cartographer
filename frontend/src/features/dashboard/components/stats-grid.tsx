import { useStats } from '@/features/dashboard/api/get-stats';
import { Card, CardBody } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

const statLabels: { key: 'locations' | 'races' | 'legs' | 'complete_routes'; label: string }[] = [
  { key: 'locations', label: 'Locations' },
  { key: 'races', label: 'Races' },
  { key: 'legs', label: 'Legs' },
  { key: 'complete_routes', label: 'Complete Routes' },
];

export function StatsGrid() {
  const { data: stats, isLoading, isError } = useStats();

  if (isLoading) {
    return (
      <div className="py-12">
        <Spinner />
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <p className="text-sm text-red-600">Failed to load stats.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statLabels.map(({ key, label }) => (
        <div id={`stat-${key}`} key={key}>
          <Card>
            <CardBody>
              <p className="text-sm font-medium text-gray-500">{label}</p>
              <p id={`stat-${key}-count`} className="mt-1 text-3xl font-semibold text-gray-900">
                {stats[key]}
              </p>
            </CardBody>
          </Card>
        </div>
      ))}
    </div>
  );
}
