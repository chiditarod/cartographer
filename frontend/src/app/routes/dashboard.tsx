import { Link } from 'react-router-dom';
import { StatsGrid } from '@/features/dashboard/components/stats-grid';
import { Button } from '@/components/ui/button';

export function DashboardRoute() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <StatsGrid />
      <div className="mt-8 flex gap-4">
        <Link to="/locations" id="manage-locations-link">
          <Button variant="secondary">Manage Locations</Button>
        </Link>
        <Link to="/races" id="manage-races-link">
          <Button variant="secondary">Manage Races</Button>
        </Link>
      </div>
    </div>
  );
}
