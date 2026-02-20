import { useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useRace } from '@/features/races/api/get-race';
import { useRoutes } from '@/features/routes/api/get-routes';
import { useTeams } from '@/features/teams/api/get-teams';
import { useImportTeamsCsv } from '@/features/teams/api/import-teams-csv';
import { useBulkAssignTeams } from '@/features/teams/api/bulk-assign-teams';
import { useDeleteTeam } from '@/features/teams/api/delete-team';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Modal } from '@/components/ui/modal';
import { Notification } from '@/components/ui/notification';
import { formatMutationError } from '@/utils/format';
import type { Team, RouteSummary } from '@/types/api';

export function TimecardsRoute() {
  const { id } = useParams<{ id: string }>();
  const raceId = Number(id);
  const { data: race, isLoading: raceLoading } = useRace(raceId);
  const { data: routes } = useRoutes(raceId);
  const { data: teams } = useTeams(raceId);
  const importCsvMutation = useImportTeamsCsv(raceId);
  const bulkAssignMutation = useBulkAssignTeams(raceId);
  const deleteTeamMutation = useDeleteTeam(raceId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [notificationVariant, setNotificationVariant] = useState<'success' | 'error'>('success');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dragTeamId, setDragTeamId] = useState<number | null>(null);
  const [bulkAssignRouteId, setBulkAssignRouteId] = useState<string>('');
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<number>>(new Set());

  if (raceLoading) return <Spinner />;
  if (!race) return <p>Race not found</p>;

  const completeRoutes = (routes ?? []).filter((r) => r.complete);
  const teamList = teams ?? [];
  const unassignedTeams = teamList.filter((t) => !t.route_id);
  const assignedTeams = teamList.filter((t) => t.route_id);
  const assignedCount = assignedTeams.length;
  const routesWithTeams = completeRoutes.filter((r) =>
    teamList.some((t) => t.route_id === r.id),
  );
  const spareCount = routesWithTeams.length * race.blank_timecards_per_route;

  const notify = (msg: string, variant: 'success' | 'error' = 'success') => {
    setNotification(msg);
    setNotificationVariant(variant);
  };

  const handleFileUpload = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    importCsvMutation.mutate(file, {
      onSuccess: (result) => {
        notify(`Imported ${result.imported} teams, ${result.skipped} skipped.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      onError: (err) => {
        notify(formatMutationError(err) ?? 'Import failed', 'error');
      },
    });
  };

  const handleDeleteAll = () => {
    deleteTeamMutation.mutate('all', {
      onSuccess: () => {
        setShowDeleteModal(false);
        notify('All teams deleted.');
        setSelectedTeamIds(new Set());
      },
    });
  };

  const handleDragStart = (teamId: number) => {
    setDragTeamId(teamId);
  };

  const handleDropOnRoute = (routeId: number) => {
    if (dragTeamId === null) return;
    const updated = teamList.map((t) =>
      t.id === dragTeamId ? { ...t, route_id: routeId } : t,
    );
    const assignments = updated
      .filter((t) => t.route_id)
      .map((t) => ({ team_id: t.id, route_id: t.route_id! }));
    bulkAssignMutation.mutate(assignments);
    setDragTeamId(null);
  };

  const handleDropOnUnassigned = () => {
    if (dragTeamId === null) return;
    const updated = teamList.map((t) =>
      t.id === dragTeamId ? { ...t, route_id: null } : t,
    );
    const assignments = updated
      .filter((t) => t.route_id)
      .map((t) => ({ team_id: t.id, route_id: t.route_id! }));
    bulkAssignMutation.mutate(assignments);
    setDragTeamId(null);
  };

  const handleBulkAssignSelected = () => {
    if (!bulkAssignRouteId || selectedTeamIds.size === 0) return;
    const routeId = Number(bulkAssignRouteId);
    const updated = teamList.map((t) =>
      selectedTeamIds.has(t.id) ? { ...t, route_id: routeId } : t,
    );
    const assignments = updated
      .filter((t) => t.route_id)
      .map((t) => ({ team_id: t.id, route_id: t.route_id! }));
    bulkAssignMutation.mutate(assignments, {
      onSuccess: () => {
        setSelectedTeamIds(new Set());
        setBulkAssignRouteId('');
      },
    });
  };

  const toggleTeamSelection = (teamId: number) => {
    setSelectedTeamIds((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  };

  const handleRemoveFromRoute = (teamId: number) => {
    const updated = teamList.map((t) =>
      t.id === teamId ? { ...t, route_id: null } : t,
    );
    const assignments = updated
      .filter((t) => t.route_id)
      .map((t) => ({ team_id: t.id, route_id: t.route_id! }));
    bulkAssignMutation.mutate(assignments);
  };

  const handleDownloadPdf = () => {
    fetch(`/api/v1/races/${raceId}/timecards/export_pdf`)
      .then((res) => {
        if (!res.ok) return res.json().then((b) => { throw new Error(b.error); });
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `race-${raceId}-timecards.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      })
      .catch((err) => notify(err.message ?? 'PDF generation failed', 'error'));
  };

  const teamsForRoute = (routeId: number) =>
    teamList.filter((t) => t.route_id === routeId);

  return (
    <div>
      {notification && (
        <Notification
          message={notification}
          variant={notificationVariant}
          onDismiss={() => setNotification(null)}
        />
      )}

      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete All Teams"
      >
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to delete all {teamList.length} teams? This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            id="confirm-delete-all-teams"
            variant="danger"
            loading={deleteTeamMutation.isPending}
            onClick={handleDeleteAll}
          >
            Delete All
          </Button>
        </div>
      </Modal>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            to={`/races/${id}`}
            className="text-sm text-indigo-600 hover:text-indigo-800 mb-1 inline-block"
          >
            &larr; Back to Race
          </Link>
          <h1 id="timecards-page-title" className="text-2xl font-bold text-gray-900">
            {race.name} &mdash; Timecards
          </h1>
        </div>
      </div>

      {/* Section 1: CSV Upload */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Import Teams</h2>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            id="csv-file-input"
            type="file"
            accept=".csv"
            className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          <Button
            id="upload-csv-btn"
            variant="primary"
            size="sm"
            loading={importCsvMutation.isPending}
            onClick={handleFileUpload}
          >
            Upload CSV
          </Button>
          {teamList.length > 0 && (
            <Button
              id="delete-all-teams-btn"
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete All Teams ({teamList.length})
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          CSV must have &quot;number&quot; and &quot;name&quot; columns (Dogtag export format).
        </p>
      </div>

      {/* Section 2: Assignment Board */}
      {teamList.length > 0 && (
        <div className="flex gap-4 mb-6">
          {/* Unassigned column */}
          <div
            className="w-1/3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDropOnUnassigned()}
          >
            <div className="bg-white rounded-lg border border-gray-200 p-4 h-full">
              <h3 className="text-md font-semibold text-gray-900 mb-3">
                Unassigned Teams ({unassignedTeams.length})
              </h3>

              {unassignedTeams.length > 0 && completeRoutes.length > 0 && (
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                  <select
                    id="bulk-assign-route-select"
                    value={bulkAssignRouteId}
                    onChange={(e) => setBulkAssignRouteId(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1 flex-1"
                  >
                    <option value="">Assign selected to...</option>
                    {completeRoutes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name || `Route #${r.id}`}
                      </option>
                    ))}
                  </select>
                  <Button
                    id="bulk-assign-btn"
                    variant="secondary"
                    size="sm"
                    disabled={!bulkAssignRouteId || selectedTeamIds.size === 0}
                    onClick={handleBulkAssignSelected}
                  >
                    Assign ({selectedTeamIds.size})
                  </Button>
                </div>
              )}

              <div className="space-y-1 max-h-96 overflow-y-auto">
                {unassignedTeams.map((team) => (
                  <div
                    key={team.id}
                    draggable
                    onDragStart={() => handleDragStart(team.id)}
                    className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-grab active:cursor-grabbing"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTeamIds.has(team.id)}
                      onChange={() => toggleTeamSelection(team.id)}
                      className="rounded border-gray-300"
                    />
                    <span className="inline-flex items-center justify-center w-8 h-6 rounded bg-indigo-100 text-indigo-800 text-xs font-bold">
                      {team.bib_number}
                    </span>
                    <span className="text-sm text-gray-900 truncate">{team.name}</span>
                  </div>
                ))}
                {unassignedTeams.length === 0 && (
                  <p className="text-sm text-gray-400 py-4 text-center">All teams assigned</p>
                )}
              </div>
            </div>
          </div>

          {/* Route cards */}
          <div className="w-2/3 grid grid-cols-2 gap-4">
            {completeRoutes.map((route) => (
              <RouteDropCard
                key={route.id}
                route={route}
                teams={teamsForRoute(route.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDropOnRoute(route.id)}
                onDragStart={handleDragStart}
                onRemove={handleRemoveFromRoute}
              />
            ))}
            {completeRoutes.length === 0 && (
              <p className="text-sm text-gray-400 col-span-2 py-8 text-center">
                No complete routes available. Generate routes first.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Section 3: Generate Timecards */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Generate Timecards</h2>
        <p className="text-sm text-gray-600 mb-3">
          {assignedCount} team{assignedCount !== 1 ? 's' : ''} assigned across{' '}
          {routesWithTeams.length} route{routesWithTeams.length !== 1 ? 's' : ''}
          {spareCount > 0 && ` + ${spareCount} spare card${spareCount !== 1 ? 's' : ''}`}
        </p>
        <Button
          id="download-timecards-pdf-btn"
          variant="primary"
          disabled={assignedCount === 0}
          onClick={handleDownloadPdf}
        >
          Download Timecards PDF
        </Button>
      </div>
    </div>
  );
}

interface RouteDropCardProps {
  route: RouteSummary;
  teams: Team[];
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragStart: (teamId: number) => void;
  onRemove: (teamId: number) => void;
}

function RouteDropCard({
  route,
  teams,
  onDragOver,
  onDrop,
  onDragStart,
  onRemove,
}: RouteDropCardProps) {
  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="bg-white rounded-lg border-2 border-dashed border-gray-200 p-3 min-h-[120px] hover:border-indigo-300 transition-colors"
      data-testid={`route-drop-${route.id}`}
    >
      <h4 className="text-sm font-semibold text-gray-900 mb-2">
        {route.name || `Route #${route.id}`}
        <span className="ml-2 text-xs font-normal text-gray-500">
          ({teams.length} team{teams.length !== 1 ? 's' : ''})
        </span>
      </h4>
      <div className="space-y-1">
        {teams
          .sort((a, b) => a.bib_number - b.bib_number)
          .map((team) => (
            <div
              key={team.id}
              draggable
              onDragStart={() => onDragStart(team.id)}
              className="flex items-center justify-between gap-1 p-1.5 rounded bg-indigo-50 cursor-grab active:cursor-grabbing group"
            >
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-7 h-5 rounded bg-indigo-200 text-indigo-800 text-xs font-bold">
                  {team.bib_number}
                </span>
                <span className="text-xs text-gray-800 truncate">{team.name}</span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(team.id)}
                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 text-xs px-1"
                title="Remove from route"
              >
                &times;
              </button>
            </div>
          ))}
        {teams.length === 0 && (
          <p className="text-xs text-gray-400 py-2 text-center">
            Drop teams here
          </p>
        )}
      </div>
    </div>
  );
}
