import { useState, useMemo } from 'react';

import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useCreateRoute } from '@/features/routes/api/create-route';
import { useRaceLegs } from '@/features/routes/api/get-race-legs';
import type { RaceLeg } from '@/features/routes/api/get-race-legs';
import type { Race } from '@/types/api';
import { abbreviateLocation } from '@/utils/location';
import { formatMutationError } from '@/utils/format';

interface CreateRouteModalProps {
  open: boolean;
  onClose: () => void;
  race: Race;
  locationColorMap: Map<number, string>;
}

export function CreateRouteModal({ open, onClose, race, locationColorMap }: CreateRouteModalProps) {
  const [name, setName] = useState('');
  const [checkpoints, setCheckpoints] = useState<number[]>([]);
  const createMutation = useCreateRoute(race.id);
  const { data: raceLegs } = useRaceLegs(race.id);

  // Build adjacency map: from location_id -> list of legs
  const adjacencyMap = useMemo(() => {
    const map = new Map<number, RaceLeg[]>();
    if (!raceLegs) return map;
    for (const leg of raceLegs) {
      const existing = map.get(leg.start_id) || [];
      existing.push(leg);
      map.set(leg.start_id, existing);
    }
    return map;
  }, [raceLegs]);

  // Current tail of the path
  const currentTail = checkpoints.length > 0
    ? checkpoints[checkpoints.length - 1]
    : race.start_id;

  // Reachable locations from current tail (exclude finish unless deliberately adding it)
  const reachableLegs = useMemo(() => {
    const legs = adjacencyMap.get(currentTail) || [];
    // Exclude legs back to start (if start != finish) and already-visited checkpoints
    const visited = new Set([race.start_id, ...checkpoints]);
    return legs.filter((l) => !visited.has(l.finish_id) || l.finish_id === race.finish_id);
  }, [adjacencyMap, currentTail, checkpoints, race.start_id, race.finish_id]);

  // Check if finish is directly reachable from current tail
  const canFinish = useMemo(() => {
    const legs = adjacencyMap.get(currentTail) || [];
    return legs.some((l) => l.finish_id === race.finish_id);
  }, [adjacencyMap, currentTail, race.finish_id]);

  // Build the full sequence for display
  const fullSequence = useMemo(() => {
    const ids = [race.start_id, ...checkpoints];
    if (canFinish) ids.push(race.finish_id);
    return ids;
  }, [race.start_id, race.finish_id, checkpoints, canFinish]);

  // Compute leg distances along path for display
  const pathLegs = useMemo(() => {
    const ids = [race.start_id, ...checkpoints];
    const result: RaceLeg[] = [];
    for (let i = 0; i < ids.length - 1; i++) {
      const legs = adjacencyMap.get(ids[i]) || [];
      const leg = legs.find((l) => l.finish_id === ids[i + 1]);
      if (leg) result.push(leg);
    }
    return result;
  }, [race.start_id, checkpoints, adjacencyMap]);

  // Total distance
  const totalDistance = useMemo(() => {
    let total = pathLegs.reduce((sum, l) => sum + l.distance, 0);
    // Add the finish leg distance if it's reachable
    if (canFinish && checkpoints.length > 0) {
      const finishLegs = adjacencyMap.get(checkpoints[checkpoints.length - 1]) || [];
      const finishLeg = finishLegs.find((l) => l.finish_id === race.finish_id);
      if (finishLeg) total += finishLeg.distance;
    } else if (canFinish && checkpoints.length === 0) {
      const finishLegs = adjacencyMap.get(race.start_id) || [];
      const finishLeg = finishLegs.find((l) => l.finish_id === race.finish_id);
      if (finishLeg) total += finishLeg.distance;
    }
    return total;
  }, [pathLegs, canFinish, checkpoints, adjacencyMap, race.start_id, race.finish_id]);

  const locationName = (id: number): string => {
    const loc = race.locations?.find((l) => l.id === id);
    return loc ? loc.name : `Location ${id}`;
  };

  const handleAddCheckpoint = (locationId: number) => {
    setCheckpoints([...checkpoints, locationId]);
  };

  const handleRemoveLast = () => {
    setCheckpoints(checkpoints.slice(0, -1));
  };

  const handleSubmit = () => {
    createMutation.mutate(
      { raceId: race.id, name: name || undefined, location_ids: checkpoints },
      {
        onSuccess: () => {
          handleClose();
        },
      },
    );
  };

  const handleClose = () => {
    setName('');
    setCheckpoints([]);
    createMutation.reset();
    onClose();
  };

  // Filter out the finish location from the dropdown options (it's auto-appended)
  const dropdownOptions = reachableLegs.filter((l) => l.finish_id !== race.finish_id);

  const distanceDisplay = race.distance_unit === 'mi'
    ? `${(totalDistance * 0.000621371).toFixed(2)} mi`
    : `${(totalDistance / 1000).toFixed(2)} km`;

  return (
    <Modal open={open} onClose={handleClose} title="Create Custom Route" size="lg">
      <div id="create-route-modal-title" className="space-y-4">
        <Input
          label="Route Name (optional)"
          id="create-route-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Shortcut Route"
        />

        {/* Path preview */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Route Path</label>
          <div className="flex flex-wrap items-center gap-1 p-3 bg-gray-50 rounded-lg min-h-[40px]">
            {fullSequence.map((locId, i) => (
              <span key={`${locId}-${i}`} className="flex items-center gap-1">
                {i > 0 && <span className="text-gray-400 text-xs mx-0.5">&rarr;</span>}
                <Badge
                  colorClasses={locationColorMap?.get(locId)}
                  variant={locId === race.start_id || locId === race.finish_id ? 'info' : 'gray'}
                >
                  {abbreviateLocation(locationName(locId))}
                  {i === 0 && ' (Start)'}
                  {i === fullSequence.length - 1 && canFinish && ' (Finish)'}
                </Badge>
              </span>
            ))}
            {!canFinish && checkpoints.length > 0 && (
              <span className="text-gray-400 text-xs mx-0.5">&rarr; ?</span>
            )}
          </div>
          {totalDistance > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Total distance: {distanceDisplay}
            </p>
          )}
        </div>

        {/* Checkpoint selector */}
        <div>
          <label htmlFor="add-checkpoint-select" className="block text-sm font-medium text-gray-700 mb-1">
            Add Checkpoint
          </label>
          <div className="flex gap-2">
            <select
              id="add-checkpoint-select"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border px-3 py-2"
              value=""
              onChange={(e) => {
                if (e.target.value) handleAddCheckpoint(Number(e.target.value));
              }}
              disabled={dropdownOptions.length === 0}
            >
              <option value="">
                {dropdownOptions.length === 0
                  ? 'No reachable checkpoints'
                  : 'Select next checkpoint...'}
              </option>
              {dropdownOptions.map((leg) => (
                <option key={leg.id} value={leg.finish_id}>
                  {locationName(leg.finish_id)} ({leg.distance_display})
                </option>
              ))}
            </select>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRemoveLast}
              disabled={checkpoints.length === 0}
              id="remove-last-checkpoint-btn"
            >
              Undo
            </Button>
          </div>
        </div>

        {/* Error display */}
        {createMutation.error && (
          <p className="text-sm text-red-600">{formatMutationError(createMutation.error)}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            id="create-route-submit-btn"
            loading={createMutation.isPending}
            disabled={!canFinish || checkpoints.length === 0 || (race.start_id === race.finish_id && checkpoints.length === 0)}
            onClick={handleSubmit}
          >
            Create Route
          </Button>
        </div>
      </div>
    </Modal>
  );
}
