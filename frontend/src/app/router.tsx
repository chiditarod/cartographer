import { createBrowserRouter } from 'react-router-dom';
import { RootRoute } from '@/app/routes/root';
import { DashboardRoute } from '@/app/routes/dashboard';
import { LocationsRoute } from '@/app/routes/locations/locations';
import { NewLocationRoute } from '@/app/routes/locations/new-location';
import { LocationRoute } from '@/app/routes/locations/location';
import { EditLocationRoute } from '@/app/routes/locations/edit-location';
import { RacesRoute } from '@/app/routes/races/races';
import { NewRaceRoute } from '@/app/routes/races/new-race';
import { RaceRoute } from '@/app/routes/races/race';
import { EditRaceRoute } from '@/app/routes/races/edit-race';
import { RaceRoutesRoute } from '@/app/routes/routes/race-routes';
import { RouteDetailRoute } from '@/app/routes/routes/route-detail';

export const router = createBrowserRouter([
  {
    element: <RootRoute />,
    children: [
      { path: '/', element: <DashboardRoute /> },
      { path: '/locations', element: <LocationsRoute /> },
      { path: '/locations/new', element: <NewLocationRoute /> },
      { path: '/locations/:id', element: <LocationRoute /> },
      { path: '/locations/:id/edit', element: <EditLocationRoute /> },
      { path: '/races', element: <RacesRoute /> },
      { path: '/races/new', element: <NewRaceRoute /> },
      { path: '/races/:id', element: <RaceRoute /> },
      { path: '/races/:id/edit', element: <EditRaceRoute /> },
      { path: '/races/:raceId/routes', element: <RaceRoutesRoute /> },
      { path: '/races/:raceId/routes/:id', element: <RouteDetailRoute /> },
    ],
  },
]);
