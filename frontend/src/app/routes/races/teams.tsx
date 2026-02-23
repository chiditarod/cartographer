import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useRace } from '@/features/races/api/get-race';
import { useRoutes } from '@/features/routes/api/get-routes';
import { useTeams } from '@/features/teams/api/get-teams';
import { useImportTeamsCsv } from '@/features/teams/api/import-teams-csv';
import { useBulkAssignTeams } from '@/features/teams/api/bulk-assign-teams';
import { useDeleteTeam } from '@/features/teams/api/delete-team';
import { useUpdateTeam } from '@/features/teams/api/update-team';
import { useClearTeamBibs } from '@/features/teams/api/clear-team-bibs';
import { useCreateTeam } from '@/features/teams/api/create-team';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Modal } from '@/components/ui/modal';
import { Notification } from '@/components/ui/notification';
import { formatMutationError } from '@/utils/format';
import { ClickToEditName } from '@/components/ui/click-to-edit-name';
import { ClickToEditNotes } from '@/components/ui/click-to-edit-notes';
import { abbreviateLocation, buildLocationColorMap } from '@/utils/location';
import type { Team, RouteSummary } from '@/types/api';

export function TeamsRoute() {
  const { id } = useParams<{ id: string }>();
  const raceId = Number(id);
  const { data: race, isLoading: raceLoading } = useRace(raceId);
  const { data: routes } = useRoutes(raceId);
  const { data: teams } = useTeams(raceId);
  const importCsvMutation = useImportTeamsCsv(raceId);
  const bulkAssignMutation = useBulkAssignTeams(raceId);
  const deleteTeamMutation = useDeleteTeam(raceId);
  const updateTeamMutation = useUpdateTeam(raceId);
  const clearBibsMutation = useClearTeamBibs(raceId);
  const createTeamMutation = useCreateTeam(raceId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [notificationVariant, setNotificationVariant] = useState<'success' | 'error'>('success');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAutoAssignModal, setShowAutoAssignModal] = useState(false);
  const [showBibModal, setShowBibModal] = useState(false);
  const [dragTeamId, setDragTeamId] = useState<number | null>(null);
  const [bulkAssignRouteId, setBulkAssignRouteId] = useState<string>('');
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<number>>(new Set());
  const [showDistance, setShowDistance] = useState(false);
  const [showPath, setShowPath] = useState(false);

  const locationColorMap = useMemo(() => {
    const allRoutes = (routes ?? []).filter((r) => r.complete && r.selected);
    const allLocs = allRoutes.flatMap((r) => r.location_sequence);
    const unique = allLocs.filter((loc, i, arr) => arr.findIndex((l) => l.id === loc.id) === i);
    return buildLocationColorMap(unique);
  }, [routes]);

  if (raceLoading) return <Spinner />;
  if (!race) return <p>Race not found</p>;

  const completeRoutes = (routes ?? []).filter((r) => r.complete && r.selected);
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

  const handleDeleteImported = () => {
    deleteTeamMutation.mutate('imported', {
      onSuccess: () => {
        setShowDeleteModal(false);
        notify('Imported teams deleted.');
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

  const handleUnassignAll = () => {
    bulkAssignMutation.mutate([], {
      onSuccess: () => {
        setSelectedTeamIds(new Set());
        notify('All teams unassigned.');
      },
    });
  };

  const handleAutoAssign = () => {
    if (completeRoutes.length === 0 || teamList.length === 0) return;
    const routeIds = completeRoutes.map((r) => r.id);

    // Preserve existing assignments
    const alreadyAssigned = teamList
      .filter((t) => t.route_id && routeIds.includes(t.route_id))
      .map((t) => ({ team_id: t.id, route_id: t.route_id! }));

    // Only distribute unassigned teams (or teams assigned to non-selected routes)
    const toAssign = teamList
      .filter((t) => !t.route_id || !routeIds.includes(t.route_id))
      .sort((a, b) => a.dogtag_id - b.dogtag_id);

    if (toAssign.length === 0) {
      setShowAutoAssignModal(false);
      notify('All teams are already assigned.');
      return;
    }

    // Count current team load per route (from preserved assignments)
    const routeLoad = new Map<number, number>();
    routeIds.forEach((rid) => routeLoad.set(rid, 0));
    alreadyAssigned.forEach((a) => routeLoad.set(a.route_id, (routeLoad.get(a.route_id) ?? 0) + 1));

    // Round-robin unassigned teams into the least-loaded routes
    const newAssignments = toAssign.map((team) => {
      // Find the route with the fewest teams
      let minRoute = routeIds[0];
      let minCount = routeLoad.get(routeIds[0]) ?? 0;
      for (const rid of routeIds) {
        const count = routeLoad.get(rid) ?? 0;
        if (count < minCount) {
          minCount = count;
          minRoute = rid;
        }
      }
      routeLoad.set(minRoute, minCount + 1);
      return { team_id: team.id, route_id: minRoute };
    });

    const assignments = [...alreadyAssigned, ...newAssignments];
    bulkAssignMutation.mutate(assignments, {
      onSuccess: () => {
        setShowAutoAssignModal(false);
        setSelectedTeamIds(new Set());
        notify(`Assigned ${toAssign.length} unassigned team${toAssign.length !== 1 ? 's' : ''} across ${routeIds.length} routes.`);
      },
    });
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

  const handleExportEnrichedCsv = () => {
    fetch(`/api/v1/races/${raceId}/teams/export_csv`)
      .then((res) => {
        if (!res.ok) return res.json().then((b) => { throw new Error(b.error); });
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `race-${raceId}-teams-enriched.csv`;
        link.click();
        URL.revokeObjectURL(url);
      })
      .catch((err) => notify(err.message ?? 'CSV export failed', 'error'));
  };

  const handleDownloadCheckinCards = () => {
    fetch(`/api/v1/races/${raceId}/checkin_cards/export_pdf`)
      .then((res) => {
        if (!res.ok) return res.json().then((b) => { throw new Error(b.error); });
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `race-${raceId}-checkin-cards.pdf`;
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
        title="Delete Imported Teams"
      >
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to delete all teams imported from CSV? Manually created teams will be kept. This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            id="confirm-delete-all-teams"
            variant="danger"
            loading={deleteTeamMutation.isPending}
            onClick={handleDeleteImported}
          >
            Delete Imported Teams
          </Button>
        </div>
      </Modal>

      <Modal
        open={showAutoAssignModal}
        onClose={() => setShowAutoAssignModal(false)}
        title="Auto-Assign Teams"
      >
        <div className="text-sm text-gray-600 mb-4 space-y-2">
          {unassignedTeams.length > 0 ? (
            <>
              <p>
                <span className="font-medium text-gray-900">{unassignedTeams.length}</span>{' '}
                unassigned team{unassignedTeams.length !== 1 ? 's' : ''} will be evenly
                distributed across{' '}
                <span className="font-medium text-gray-900">{completeRoutes.length}</span>{' '}
                selected route{completeRoutes.length !== 1 ? 's' : ''}.
              </p>
              {assignedCount > 0 && (
                <p>
                  {assignedCount} team{assignedCount !== 1 ? 's' : ''} already assigned to
                  routes will keep {assignedCount !== 1 ? 'their' : 'its'} current
                  assignment{assignedCount !== 1 ? 's' : ''}.
                </p>
              )}
            </>
          ) : (
            <p>All teams are already assigned to routes. No changes will be made.</p>
          )}
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowAutoAssignModal(false)}>
            Cancel
          </Button>
          <Button
            id="confirm-auto-assign"
            variant="primary"
            loading={bulkAssignMutation.isPending}
            onClick={handleAutoAssign}
          >
            Auto-Assign
          </Button>
        </div>
      </Modal>

      <BibNumberModal
        open={showBibModal}
        onClose={() => setShowBibModal(false)}
        teams={teamList}
        updateTeamMutation={updateTeamMutation}
        clearBibsMutation={clearBibsMutation}
        deleteTeamMutation={deleteTeamMutation}
        createTeamMutation={createTeamMutation}
        onNotify={notify}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            to={`/races/${id}`}
            className="text-sm text-indigo-600 hover:text-indigo-800 mb-1 inline-block"
          >
            &larr; Back to Race
          </Link>
          <h1 id="teams-page-title" className="text-2xl font-bold text-gray-900">
            {race.name} &mdash; Teams
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <button
              id="toggle-show-distance"
              type="button"
              onClick={() => setShowDistance((v) => !v)}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${showDistance ? 'bg-indigo-600' : 'bg-gray-200'}`}
              role="switch"
              aria-checked={showDistance}
              aria-label="Show distance"
            >
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${showDistance ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
            <span className="text-xs text-gray-500">Distance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              id="toggle-show-path"
              type="button"
              onClick={() => setShowPath((v) => !v)}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${showPath ? 'bg-indigo-600' : 'bg-gray-200'}`}
              role="switch"
              aria-checked={showPath}
              aria-label="Show path"
            >
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${showPath ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
            <span className="text-xs text-gray-500">Path</span>
          </div>
        </div>
      </div>

      {/* Top row: Import | Assign | Generate */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Import Teams</h2>
          <input
            ref={fileInputRef}
            id="csv-file-input"
            type="file"
            accept=".csv"
            className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 mb-2"
          />
          <div className="flex items-center gap-3">
            <Button
              id="upload-csv-btn"
              variant="primary"
              size="sm"
              loading={importCsvMutation.isPending}
              onClick={handleFileUpload}
            >
              Import Dogtag CSV
            </Button>
            {race.has_dogtag_csv && (
              <Button
                id="delete-all-teams-btn"
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
              >
                Delete Imported Teams
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            CSV of Finalized Teams from Dogtag.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Edit</h2>
          <p className="text-sm text-gray-600 mb-3">
            {assignedCount} of {teamList.length} team{teamList.length !== 1 ? 's' : ''} assigned
            across {routesWithTeams.length} route{routesWithTeams.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-3">
            {teamList.length > 0 && (
              <Button
                id="team-bibs-btn"
                variant="primary"
                size="sm"
                onClick={() => setShowBibModal(true)}
              >
                Team Details
              </Button>
            )}
            {completeRoutes.length > 0 && teamList.length > 0 && (
              <Button
                id="auto-assign-btn"
                variant="secondary"
                size="sm"
                onClick={() => setShowAutoAssignModal(true)}
              >
                Balance Teams
              </Button>
            )}
            {assignedCount > 0 && (
              <Button
                id="unassign-all-btn"
                variant="secondary"
                size="sm"
                loading={bulkAssignMutation.isPending}
                onClick={handleUnassignAll}
              >
                Unassign All Teams
              </Button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Generate</h2>
          <p className="text-sm text-gray-600 mb-3">
            {assignedCount} team{assignedCount !== 1 ? 's' : ''} assigned across{' '}
            {routesWithTeams.length} route{routesWithTeams.length !== 1 ? 's' : ''}
            {spareCount > 0 && ` + ${spareCount} spare card${spareCount !== 1 ? 's' : ''}`}
          </p>
          <div className="flex gap-2">
            <Button
              id="download-timecards-pdf-btn"
              variant="primary"
              disabled={assignedCount === 0}
              onClick={handleDownloadPdf}
            >
              Download Timecards PDF
            </Button>
            <Button
              id="download-checkin-cards-pdf-btn"
              variant="secondary"
              disabled={assignedCount === 0}
              onClick={handleDownloadCheckinCards}
            >
              Download Check-in Cards PDF
            </Button>
            <Button
              id="export-enriched-csv-btn"
              variant="secondary"
              disabled={!race.has_dogtag_csv || teamList.length === 0}
              onClick={handleExportEnrichedCsv}
            >
              Export Enriched CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Assignment Board */}
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
                      {team.display_number}
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
                raceId={raceId}
                route={route}
                teams={teamsForRoute(route.id)}
                showDistance={showDistance}
                showPath={showPath}
                locationColorMap={locationColorMap}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDropOnRoute(route.id)}
                onDragStart={handleDragStart}
                onRemove={handleRemoveFromRoute}
              />
            ))}
            {completeRoutes.length === 0 && (
              <p className="text-sm text-gray-400 col-span-2 py-8 text-center">
                No selected routes. <Link to={`/races/${id}`} className="text-indigo-600 hover:text-indigo-800">Select routes on the race page</Link> first.
              </p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

interface BibNumberModalProps {
  open: boolean;
  onClose: () => void;
  teams: Team[];
  updateTeamMutation: ReturnType<typeof useUpdateTeam>;
  clearBibsMutation: ReturnType<typeof useClearTeamBibs>;
  deleteTeamMutation: ReturnType<typeof useDeleteTeam>;
  createTeamMutation: ReturnType<typeof useCreateTeam>;
  onNotify: (msg: string, variant?: 'success' | 'error') => void;
}

function BibNumberModal({
  open,
  onClose,
  teams,
  updateTeamMutation,
  clearBibsMutation,
  deleteTeamMutation,
  createTeamMutation,
  onNotify,
}: BibNumberModalProps) {
  const [bibValues, setBibValues] = useState<Record<number, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingNameId, setEditingNameId] = useState<number | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [newName, setNewName] = useState('');
  const [newDogtag, setNewDogtag] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const newNameRef = useRef<HTMLInputElement>(null);
  const inputRefs = useRef<Map<number, HTMLInputElement>>(new Map());
  // Track pending auto-populated values that should not be overwritten by query refresh
  const pendingAutoValues = useRef<Record<number, string>>({});
  const sortedTeams = useMemo(
    () => [...teams].sort((a, b) => a.dogtag_id - b.dogtag_id),
    [teams],
  );

  // Sync bibValues with teams data when modal opens or teams refresh
  useEffect(() => {
    if (open) {
      const values: Record<number, string> = {};
      teams.forEach((t) => {
        // Preserve pending auto-populated values over server state
        if (pendingAutoValues.current[t.id] !== undefined) {
          values[t.id] = pendingAutoValues.current[t.id];
        } else {
          values[t.id] = t.bib_number != null ? String(t.bib_number) : '';
        }
      });
      setBibValues(values);
    }
  }, [open, teams]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedIds(new Set());
      setShowDeleteConfirm(false);
      setEditingNameId(null);
      setEditingNameValue('');
      setNewName('');
      setNewDogtag('');
      setAddError(null);
      pendingAutoValues.current = {};
    }
  }, [open]);

  const advanceToNext = (index: number, savedBib: number | null) => {
    const nextTeam = sortedTeams[index + 1];
    if (nextTeam) {
      // Auto-populate next row with saved value + 1
      if (savedBib !== null) {
        const nextVal = String(savedBib + 1);
        pendingAutoValues.current[nextTeam.id] = nextVal;
        setBibValues((prev) => ({ ...prev, [nextTeam.id]: nextVal }));
      }
      // Focus and select the next input
      const nextInput = inputRefs.current.get(nextTeam.id);
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    }
  };

  const handleSaveBib = (teamId: number, index: number) => {
    const raw = bibValues[teamId]?.trim() ?? '';
    const newBib = raw === '' ? null : Number(raw);

    // Clear pending auto-value for this team since user is saving it
    delete pendingAutoValues.current[teamId];

    // Validate
    if (newBib !== null && (isNaN(newBib) || newBib <= 0 || !Number.isInteger(newBib))) {
      onNotify('Bib # must be a positive integer', 'error');
      return;
    }

    const team = teams.find((t) => t.id === teamId);
    if (!team) return;

    // Skip save if unchanged
    if (newBib === team.bib_number) {
      advanceToNext(index, newBib);
      return;
    }

    updateTeamMutation.mutate(
      { teamId, bib_number: newBib },
      {
        onSuccess: () => {
          advanceToNext(index, newBib);
        },
        onError: (err) => {
          onNotify(formatMutationError(err) ?? 'Failed to update bib number', 'error');
        },
      },
    );
  };

  const handleClearAll = () => {
    pendingAutoValues.current = {};
    clearBibsMutation.mutate(undefined, {
      onSuccess: () => {
        onNotify('All bib numbers cleared.');
      },
      onError: (err) => {
        onNotify(formatMutationError(err) ?? 'Failed to clear bib numbers', 'error');
      },
    });
  };

  const handleSaveName = (teamId: number) => {
    const trimmed = editingNameValue.trim();
    if (!trimmed) {
      onNotify('Team name cannot be blank', 'error');
      return;
    }
    const team = teams.find((t) => t.id === teamId);
    if (!team || trimmed === team.name) {
      setEditingNameId(null);
      return;
    }
    updateTeamMutation.mutate(
      { teamId, name: trimmed },
      {
        onSuccess: () => {
          setEditingNameId(null);
        },
        onError: (err) => {
          onNotify(formatMutationError(err) ?? 'Failed to update name', 'error');
        },
      },
    );
  };

  const toggleSelect = (teamId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedTeams.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedTeams.map((t) => t.id)));
    }
  };

  const handleDeleteSelected = () => {
    const ids = Array.from(selectedIds);
    let completed = 0;
    let failed = 0;

    ids.forEach((teamId) => {
      deleteTeamMutation.mutate(teamId, {
        onSuccess: () => {
          completed++;
          if (completed + failed === ids.length) {
            setSelectedIds(new Set());
            setShowDeleteConfirm(false);
            onNotify(`Deleted ${completed} team${completed !== 1 ? 's' : ''}.`);
          }
        },
        onError: () => {
          failed++;
          if (completed + failed === ids.length) {
            setSelectedIds(new Set());
            setShowDeleteConfirm(false);
            onNotify(
              `Deleted ${completed} team${completed !== 1 ? 's' : ''}, ${failed} failed.`,
              failed > 0 ? 'error' : 'success',
            );
          }
        },
      });
    });
  };

  const handleAddTeam = () => {
    setAddError(null);
    const trimmedName = newName.trim();
    const trimmedDogtag = newDogtag.trim();

    if (!trimmedName) {
      setAddError('Name is required.');
      return;
    }
    if (!trimmedDogtag) {
      setAddError('ID is required.');
      return;
    }
    const dogtagNum = Number(trimmedDogtag);
    if (isNaN(dogtagNum) || !Number.isInteger(dogtagNum) || dogtagNum <= 0) {
      setAddError('ID must be a positive integer.');
      return;
    }
    if (teams.some((t) => t.dogtag_id === dogtagNum)) {
      setAddError(`ID ${dogtagNum} already exists.`);
      return;
    }

    createTeamMutation.mutate(
      { name: trimmedName, dogtag_id: dogtagNum },
      {
        onSuccess: () => {
          setNewName('');
          setNewDogtag('');
          setAddError(null);
          onNotify(`Team "${trimmedName}" added.`);
          newNameRef.current?.focus();
        },
        onError: (err) => {
          setAddError(formatMutationError(err) ?? 'Failed to add team.');
        },
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title="Team Details" size="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Assign custom bib numbers to teams. Press Enter to save and advance.
          </p>
          <div className="flex items-center gap-2">
            <Button
              id="delete-selected-teams-btn"
              variant="danger"
              size="sm"
              disabled={selectedIds.size === 0}
              onClick={() => setShowDeleteConfirm(true)}
            >
              {selectedIds.size > 0 ? `Delete (${selectedIds.size})` : 'Delete'}
            </Button>
            <Button
              id="clear-all-bibs-btn"
              variant="secondary"
              size="sm"
              loading={clearBibsMutation.isPending}
              onClick={handleClearAll}
            >
              Clear all Bib #s
            </Button>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="bg-red-50 border border-red-200 rounded p-3 flex items-center justify-between">
            <p className="text-sm text-red-800">
              Delete {selectedIds.size} team{selectedIds.size !== 1 ? 's' : ''}? This cannot be undone.
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                id="confirm-delete-selected-teams"
                variant="danger"
                size="sm"
                loading={deleteTeamMutation.isPending}
                onClick={handleDeleteSelected}
              >
                Delete
              </Button>
            </div>
          </div>
        )}

        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white border-b border-gray-200">
              <tr>
                <th className="py-2 px-2 w-8">
                  <input
                    type="checkbox"
                    checked={sortedTeams.length > 0 && selectedIds.size === sortedTeams.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="text-left py-2 px-2 font-medium text-gray-700">Team Name</th>
                <th className="text-left py-2 px-2 font-medium text-gray-700 w-20">ID</th>
                <th className="text-left py-2 px-2 font-medium text-gray-700 w-24">Bib #</th>
              </tr>
            </thead>
            <tbody>
              {sortedTeams.map((team, index) => (
                <tr key={team.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-1.5 px-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(team.id)}
                      onChange={() => toggleSelect(team.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="py-1.5 px-2 text-gray-900">
                    {editingNameId === team.id ? (
                      <input
                        data-testid={`name-input-${team.id}`}
                        type="text"
                        autoFocus
                        value={editingNameValue}
                        onChange={(e) => setEditingNameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveName(team.id);
                          } else if (e.key === 'Escape') {
                            e.stopPropagation();
                            setEditingNameId(null);
                          }
                        }}
                        onBlur={() => handleSaveName(team.id)}
                        className="w-full px-2 py-0.5 border border-indigo-300 rounded text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    ) : (
                      <span
                        data-testid={`name-display-${team.id}`}
                        className="cursor-pointer hover:text-indigo-600"
                        onClick={() => {
                          setEditingNameId(team.id);
                          setEditingNameValue(team.name);
                        }}
                      >
                        {team.name}
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 px-2 text-gray-500">{team.dogtag_id}</td>
                  <td className="py-1.5 px-2">
                    <input
                      ref={(el) => {
                        if (el) inputRefs.current.set(team.id, el);
                        else inputRefs.current.delete(team.id);
                      }}
                      data-testid={`bib-input-${team.id}`}
                      type="text"
                      inputMode="numeric"
                      value={bibValues[team.id] ?? ''}
                      onChange={(e) => {
                        // User manually editing clears any pending auto-value
                        delete pendingAutoValues.current[team.id];
                        setBibValues((prev) => ({ ...prev, [team.id]: e.target.value }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveBib(team.id, index);
                        }
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="-"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Team form */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Add Team</h4>
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <input
                ref={newNameRef}
                id="add-team-name"
                type="text"
                value={newName}
                onChange={(e) => { setNewName(e.target.value); setAddError(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTeam(); } }}
                placeholder="Team name"
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="w-24">
              <input
                id="add-team-dogtag"
                type="text"
                inputMode="numeric"
                value={newDogtag}
                onChange={(e) => { setNewDogtag(e.target.value); setAddError(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTeam(); } }}
                placeholder="ID"
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <Button
              id="add-team-btn"
              variant="primary"
              size="sm"
              loading={createTeamMutation.isPending}
              onClick={handleAddTeam}
            >
              Add
            </Button>
          </div>
          {addError && (
            <p className="text-xs text-red-600 mt-1">{addError}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

interface RouteDropCardProps {
  raceId: number;
  route: RouteSummary;
  teams: Team[];
  showDistance: boolean;
  showPath: boolean;
  locationColorMap: Map<number, string>;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragStart: (teamId: number) => void;
  onRemove: (teamId: number) => void;
}

function RouteDropCard({
  raceId,
  route,
  teams,
  showDistance,
  showPath,
  locationColorMap,
  onDragOver,
  onDrop,
  onDragStart,
  onRemove,
}: RouteDropCardProps) {
  const distanceDisplay = route.distance != null
    ? `${route.distance.toFixed(2)} ${route.distance_unit}`
    : null;

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="bg-white rounded-lg border-2 border-dashed border-gray-200 p-3 min-h-[120px] hover:border-indigo-300 transition-colors"
      data-testid={`route-drop-${route.id}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <h4 className="text-sm font-semibold text-gray-900">
          <ClickToEditName
            raceId={raceId}
            routeId={route.id}
            name={route.name}
            fallback={`Route #${route.id}`}
            testIdPrefix="route-card-name"
          />
        </h4>
        <span className="text-xs text-gray-500">
          ({teams.length} team{teams.length !== 1 ? 's' : ''})
        </span>
        {showDistance && distanceDisplay && (
          <span className="text-xs text-gray-500">
            &middot; {distanceDisplay}
          </span>
        )}
      </div>
      {showPath && route.location_sequence.length > 0 && (
        <div className="flex flex-wrap items-center gap-0.5 mb-2">
          {route.location_sequence.map((loc, i) => (
            <React.Fragment key={`${route.id}-loc-${i}`}>
              {i > 0 && <span className="text-gray-400 text-[10px] mx-0.5">&rarr;</span>}
              <Badge colorClasses={locationColorMap.get(loc.id)}>
                {abbreviateLocation(loc.name)}
              </Badge>
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="mb-2">
        <ClickToEditNotes
          raceId={raceId}
          routeId={route.id}
          notes={route.notes}
          testIdPrefix="route-card-notes"
        />
      </div>
      <div className="space-y-1">
        {teams
          .sort((a, b) => a.dogtag_id - b.dogtag_id)
          .map((team) => (
            <div
              key={team.id}
              draggable
              onDragStart={() => onDragStart(team.id)}
              className="flex items-center justify-between gap-1 p-1.5 rounded bg-indigo-50 cursor-grab active:cursor-grabbing group"
            >
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center justify-center w-7 h-5 rounded bg-indigo-200 text-indigo-800 text-xs font-bold">
                  {team.display_number}
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
