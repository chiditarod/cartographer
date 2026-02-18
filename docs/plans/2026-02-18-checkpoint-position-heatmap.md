# Checkpoint Position Usage Heat-Map Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the flat "Location Usage in Routes" badges with a heat-map table showing per-position checkpoint usage across all routes.

**Architecture:** Frontend-only change. Compute a `Map<locationId, Map<position, count>>` from existing `routes[].location_sequence` data, skipping start (index 0) and finish (last index). Render as an HTML table with per-column HSL color interpolation.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 3.4

---

### Task 1: Replace data computation

**Files:**
- Modify: `frontend/src/features/races/components/race-detail.tsx:1-20`

**Step 1: Replace the `locationUsage` computation with position-based computation**

Replace lines 1-20 of `race-detail.tsx` with:

```tsx
import type { Race, RouteSummary } from '@/types/api';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RaceDetailProps {
  race: Race;
  locationColorMap: Map<number, string>;
  routes?: RouteSummary[];
}

export function RaceDetail({ race, locationColorMap, routes }: RaceDetailProps) {
  // Build position usage: locationId -> (checkpointPosition -> count)
  // Skip index 0 (start) and last index (finish)
  const positionUsage = new Map<number, Map<number, number>>();
  const numCheckpoints = race.num_stops;

  if (routes) {
    for (const route of routes) {
      const seq = route.location_sequence;
      // Intermediate checkpoints are indices 1 through seq.length - 2
      for (let i = 1; i < seq.length - 1; i++) {
        const loc = seq[i];
        const cp = i; // checkpoint position (1-based)
        if (!positionUsage.has(loc.id)) {
          positionUsage.set(loc.id, new Map());
        }
        const locMap = positionUsage.get(loc.id)!;
        locMap.set(cp, (locMap.get(cp) || 0) + 1);
      }
    }
  }
```

Note: the `abbreviateLocation` import is removed since it's no longer used.

**Step 2: Verify frontend compiles**

Run: `cd /Users/devin/repo/cartographer/frontend && npx tsc --noEmit`
Expected: No errors (file is mid-edit but types should be valid)

---

### Task 2: Add heat-map color helper

**Files:**
- Modify: `frontend/src/features/races/components/race-detail.tsx` (add helper before the component)

**Step 1: Add the `heatColor` function after the imports, before the interface**

Insert after the imports and before `interface RaceDetailProps`:

```tsx
function heatColor(value: number, min: number, max: number): string {
  if (min === max) return 'hsl(0, 0%, 92%)'; // neutral gray when all equal
  const t = (value - min) / (max - min); // 0 = low, 1 = high
  // Interpolate: green (120) -> yellow (45) -> red (0)
  const hue = t <= 0.5
    ? 120 - t * 2 * (120 - 45)   // green to yellow
    : 45 - (t - 0.5) * 2 * 45;   // yellow to red
  const sat = 40 + t * 10;        // 40% to 50%
  const light = 90 - t * 2;       // 90% to 88%
  return `hsl(${Math.round(hue)}, ${Math.round(sat)}%, ${Math.round(light)}%)`;
}
```

---

### Task 3: Replace the "Location Usage in Routes" JSX with heat-map table

**Files:**
- Modify: `frontend/src/features/races/components/race-detail.tsx:105-116`

**Step 1: Replace the location usage section (lines 105-116) with the heat-map table**

Replace:
```tsx
        {race.locations && race.locations.length > 0 && locationUsage.size > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Location Usage in Routes</h3>
            <div className="flex flex-wrap gap-2">
              {race.locations.map((loc) => (
                <Badge key={loc.id} colorClasses={locationColorMap.get(loc.id)}>
                  {abbreviateLocation(loc.name)}: {locationUsage.get(loc.id) || 0}
                </Badge>
              ))}
            </div>
          </div>
        )}
```

With:
```tsx
        {race.locations && race.locations.length > 0 && positionUsage.size > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Checkpoint Position Usage</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left pr-4 py-1 text-gray-500 font-medium">Location</th>
                    {Array.from({ length: numCheckpoints }, (_, i) => (
                      <th key={i + 1} className="px-3 py-1 text-center text-gray-500 font-medium">
                        CP {i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {race.locations
                    .filter((loc) => positionUsage.has(loc.id))
                    .map((loc) => (
                      <tr key={loc.id}>
                        <td className="pr-4 py-1">
                          <Badge colorClasses={locationColorMap.get(loc.id)}>{loc.name}</Badge>
                        </td>
                        {Array.from({ length: numCheckpoints }, (_, i) => {
                          const cp = i + 1;
                          const count = positionUsage.get(loc.id)?.get(cp) || 0;
                          // Compute per-column min/max for heat-map scaling
                          let colMin = Infinity;
                          let colMax = -Infinity;
                          for (const [, locMap] of positionUsage) {
                            const v = locMap.get(cp) || 0;
                            if (v < colMin) colMin = v;
                            if (v > colMax) colMax = v;
                          }
                          return (
                            <td
                              key={cp}
                              className="px-3 py-1 text-center font-mono rounded"
                              style={{ backgroundColor: heatColor(count, colMin, colMax) }}
                            >
                              {count}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
```

**Step 2: Verify frontend compiles**

Run: `cd /Users/devin/repo/cartographer/frontend && npx tsc --noEmit`
Expected: No errors

**Step 3: Verify frontend builds**

Run: `cd /Users/devin/repo/cartographer/frontend && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add frontend/src/features/races/components/race-detail.tsx
git commit -m "Replace location usage badges with checkpoint position heat-map table"
```

---

### Task 4: Visual verification with Playwright

**Step 1: Start dev servers if not running and navigate to race detail page**

Use the Playwright MCP to navigate to a race detail page and verify:
- The "Checkpoint Position Usage" table renders
- Location badges appear in the first column
- CP columns show counts with colored backgrounds
- Green = low, red = high within each column

**Step 2: Take a screenshot for review**

Capture the race detail card area showing the heat-map table.

---

### Task 5: Optimize per-column min/max computation

The per-column min/max is recomputed inside the inner loop for every cell. Hoist it out.

**Files:**
- Modify: `frontend/src/features/races/components/race-detail.tsx`

**Step 1: Precompute column min/max before the JSX return**

Add after the `positionUsage` computation, before `return (`:

```tsx
  // Precompute per-column min/max for heat-map scaling
  const colBounds = new Map<number, { min: number; max: number }>();
  for (let cp = 1; cp <= numCheckpoints; cp++) {
    let min = Infinity;
    let max = -Infinity;
    for (const [, locMap] of positionUsage) {
      const v = locMap.get(cp) || 0;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    colBounds.set(cp, { min, max });
  }
```

**Step 2: Update the table cell to use precomputed bounds**

Replace the inline min/max computation in the table cell with:

```tsx
{Array.from({ length: numCheckpoints }, (_, i) => {
  const cp = i + 1;
  const count = positionUsage.get(loc.id)?.get(cp) || 0;
  const { min: colMin, max: colMax } = colBounds.get(cp)!;
  return (
    <td
      key={cp}
      className="px-3 py-1 text-center font-mono rounded"
      style={{ backgroundColor: heatColor(count, colMin, colMax) }}
    >
      {count}
    </td>
  );
})}
```

**Step 3: Verify frontend builds**

Run: `cd /Users/devin/repo/cartographer/frontend && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add frontend/src/features/races/components/race-detail.tsx
git commit -m "Optimize heat-map by precomputing per-column min/max bounds"
```

---

### Task 6: Run existing tests to verify no regressions

**Step 1: Run RSpec tests**

Run: `cd /Users/devin/repo/cartographer && bundle exec rspec`
Expected: All tests pass (no backend changes, so this is a sanity check)

**Step 2: Run E2E tests**

Run: `cd /Users/devin/repo/cartographer/e2e && npx playwright test --reporter=list`
Expected: All tests pass

**Step 3: Final commit (if any fixes needed)**

---

### Task 7: Update CLAUDE.md and README if needed

**Step 1: Update CLAUDE.md with any key learnings**

**Step 2: Commit updates**
