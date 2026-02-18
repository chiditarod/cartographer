# Route Path Visualization & Location Usage Stats Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show each completed route as a colored abbreviation path (e.g., `[CL] → [RP] → [5S] → [PMI] → [CL]`) on the race detail page, with unique colors per location and usage stats.

**Architecture:** Add `location_sequence` to route summary API response (no extra queries — already eager-loaded). Create frontend utilities for location abbreviation and color assignment. Update Badge to accept custom color classes. Update RaceDetail and RoutesList components to display colored badges, route paths, and usage counts.

**Tech Stack:** Rails API serialization, React, TypeScript, Tailwind CSS, TanStack React Query

---

### Task 1: Add `location_sequence` to route summary API

**Files:**
- Modify: `app/controllers/api/v1/routes_controller.rb:44-55`
- Modify: `spec/requests/api/v1/routes_spec.rb:9-18`
- Modify: `frontend/src/types/api.ts:50-60`

**Step 1: Write the failing test**

Add to `spec/requests/api/v1/routes_spec.rb` inside the `GET /api/v1/races/:race_id/routes` describe block:

```ruby
it 'includes location_sequence in each route' do
  get "/api/v1/races/#{race.id}/routes"
  json = JSON.parse(response.body)
  json.each do |r|
    expect(r).to have_key('location_sequence')
    expect(r['location_sequence']).to be_an(Array)
    r['location_sequence'].each do |loc|
      expect(loc).to have_key('id')
      expect(loc).to have_key('name')
    end
  end
end
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/devin/repo/cartographer && bundle exec rspec spec/requests/api/v1/routes_spec.rb`
Expected: FAIL — `location_sequence` key not present

**Step 3: Implement `location_sequence` in serializer**

In `app/controllers/api/v1/routes_controller.rb`, update `serialize_route` to always include `location_sequence`. Add after line 54 (`created_at: r.created_at`):

```ruby
data[:location_sequence] = if r.legs.any?
  r.legs.map { |l| { id: l.start.id, name: l.start.name } } +
    [{ id: r.legs.last.finish.id, name: r.legs.last.finish.name }]
else
  []
end
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/devin/repo/cartographer && bundle exec rspec spec/requests/api/v1/routes_spec.rb`
Expected: All PASS

**Step 5: Update TypeScript type**

In `frontend/src/types/api.ts`, add `location_sequence` to `RouteSummary`:

```typescript
export interface RouteSummary {
  id: number;
  name: string | null;
  race_id: number;
  complete: boolean;
  distance: number;
  distance_unit: 'mi' | 'km';
  leg_count: number;
  target_leg_count: number;
  location_sequence: { id: number; name: string }[];
  created_at: string;
}
```

**Step 6: Run full backend tests**

Run: `cd /Users/devin/repo/cartographer && bundle exec rspec`
Expected: All pass

**Step 7: Commit**

```bash
git add app/controllers/api/v1/routes_controller.rb spec/requests/api/v1/routes_spec.rb frontend/src/types/api.ts
git commit -m "Add location_sequence to route summary API response"
```

---

### Task 2: Add location abbreviation utility and color palette

**Files:**
- Create: `frontend/src/utils/location.ts`

**Step 1: Create the utility file**

Create `frontend/src/utils/location.ts` with two exports:

```typescript
/**
 * Abbreviate a location name by taking the first character of each word.
 * "Phyllis' Musical Inn" → "PMI", "5 Star Bar" → "5SB"
 */
export function abbreviateLocation(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

/**
 * Palette of 14 distinct Tailwind-compatible color pairs.
 * Each entry is [bgClass, textClass].
 */
const LOCATION_COLORS: [string, string][] = [
  ['bg-blue-100', 'text-blue-800'],
  ['bg-emerald-100', 'text-emerald-800'],
  ['bg-amber-100', 'text-amber-800'],
  ['bg-rose-100', 'text-rose-800'],
  ['bg-violet-100', 'text-violet-800'],
  ['bg-cyan-100', 'text-cyan-800'],
  ['bg-orange-100', 'text-orange-800'],
  ['bg-teal-100', 'text-teal-800'],
  ['bg-pink-100', 'text-pink-800'],
  ['bg-indigo-100', 'text-indigo-800'],
  ['bg-lime-100', 'text-lime-800'],
  ['bg-fuchsia-100', 'text-fuchsia-800'],
  ['bg-sky-100', 'text-sky-800'],
  ['bg-red-100', 'text-red-800'],
];

/**
 * Build a map from location ID to its unique color classes.
 * Uses index position in the locations array (which is sorted by name from the API).
 */
export function buildLocationColorMap(
  locations: { id: number }[]
): Map<number, string> {
  const map = new Map<number, string>();
  locations.forEach((loc, index) => {
    const [bg, text] = LOCATION_COLORS[index % LOCATION_COLORS.length];
    map.set(loc.id, `${bg} ${text}`);
  });
  return map;
}
```

**Step 2: Commit**

```bash
git add frontend/src/utils/location.ts
git commit -m "Add location abbreviation utility and color palette"
```

---

### Task 3: Update Badge component to accept custom color classes

**Files:**
- Modify: `frontend/src/components/ui/badge.tsx`

**Step 1: Update Badge to accept `colorClasses` prop**

Replace the entire `frontend/src/components/ui/badge.tsx`:

```typescript
const variants = {
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  gray: 'bg-gray-100 text-gray-800',
};

interface BadgeProps {
  variant?: keyof typeof variants;
  colorClasses?: string;
  children: React.ReactNode;
}

export function Badge({ variant = 'gray', colorClasses, children }: BadgeProps) {
  const classes = colorClasses || variants[variant];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}
    >
      {children}
    </span>
  );
}
```

When `colorClasses` is provided, it takes precedence over `variant`. All existing uses pass `variant` without `colorClasses`, so nothing breaks.

**Step 2: Build frontend to verify no type errors**

Run: `cd /Users/devin/repo/cartographer/frontend && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add frontend/src/components/ui/badge.tsx
git commit -m "Add colorClasses prop to Badge component"
```

---

### Task 4: Update Location Pool in RaceDetail to use unique colors

**Files:**
- Modify: `frontend/src/features/races/components/race-detail.tsx`

**Step 1: Update RaceDetail to use colored badges**

Update `frontend/src/features/races/components/race-detail.tsx`:

1. Add imports at top:
```typescript
import { buildLocationColorMap } from '@/utils/location';
```

2. Inside the component, before the return, build the color map:
```typescript
const locationColorMap = race.locations ? buildLocationColorMap(race.locations) : new Map();
```

3. Replace the location pool Badge usage (lines 84-87):
```tsx
{race.locations.map((loc) => (
  <Badge key={loc.id} colorClasses={locationColorMap.get(loc.id)}>
    {loc.name}
  </Badge>
))}
```

**Step 2: Build frontend to verify**

Run: `cd /Users/devin/repo/cartographer/frontend && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add frontend/src/features/races/components/race-detail.tsx
git commit -m "Use unique colors for location pool badges"
```

---

### Task 5: Add route path visualization to RoutesList

**Files:**
- Modify: `frontend/src/features/routes/components/routes-list.tsx`

**Step 1: Update RoutesList to accept `locationColorMap` prop and render path sub-rows**

Update `frontend/src/features/routes/components/routes-list.tsx`:

1. Add imports:
```typescript
import { abbreviateLocation } from '@/utils/location';
import { Badge } from '@/components/ui/badge';
```

2. Update props interface:
```typescript
interface RoutesListProps {
  raceId: number;
  locationColorMap?: Map<number, string>;
}
```

3. Update function signature:
```typescript
export function RoutesList({ raceId, locationColorMap }: RoutesListProps) {
```

4. Replace the `{routes.map((route) => (` block inside `<tbody>` to render two rows per route — the existing data row plus a path sub-row:

```tsx
{routes.map((route) => (
  <React.Fragment key={route.id}>
    <tr>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {route.name || `Route #${route.id}`}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {route.distance} {route.distance_unit}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {route.leg_count} / {route.target_leg_count}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <Link
          to={`/races/${raceId}/routes/${route.id}`}
          className="text-indigo-600 hover:text-indigo-900"
        >
          View
        </Link>
      </td>
    </tr>
    {route.location_sequence.length > 0 && (
      <tr>
        <td colSpan={4} className="px-6 pb-4 pt-0">
          <div className="flex flex-wrap items-center gap-1">
            {route.location_sequence.map((loc, i) => (
              <React.Fragment key={`${route.id}-loc-${i}`}>
                {i > 0 && (
                  <span className="text-gray-400 text-xs mx-0.5">&rarr;</span>
                )}
                <Badge
                  colorClasses={locationColorMap?.get(loc.id)}
                >
                  {abbreviateLocation(loc.name)}
                </Badge>
              </React.Fragment>
            ))}
          </div>
        </td>
      </tr>
    )}
  </React.Fragment>
))}
```

5. Add React import at top if not present: `import React from 'react';`

**Step 2: Build frontend to verify**

Run: `cd /Users/devin/repo/cartographer/frontend && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add frontend/src/features/routes/components/routes-list.tsx
git commit -m "Add route path visualization with colored abbreviation badges"
```

---

### Task 6: Wire up locationColorMap from race page to RoutesList

**Files:**
- Modify: `frontend/src/app/routes/races/race.tsx`

**Step 1: Pass locationColorMap to RoutesList**

Update `frontend/src/app/routes/races/race.tsx`:

1. Add import:
```typescript
import { buildLocationColorMap } from '@/utils/location';
```

2. Inside the component, after the loading/null guards and before the return, build the map:
```typescript
const locationColorMap = race.locations ? buildLocationColorMap(race.locations) : new Map();
```

3. Pass it to `RoutesList` (line 110):
```tsx
<RoutesList raceId={raceId} locationColorMap={locationColorMap} />
```

4. Also pass it to `RaceDetail` — update the component call (line 91):
```tsx
<RaceDetail race={race} locationColorMap={locationColorMap} />
```

5. Update `RaceDetail` props to accept the map instead of building it internally. In `frontend/src/features/races/components/race-detail.tsx`, update the interface:
```typescript
interface RaceDetailProps {
  race: Race;
  locationColorMap: Map<number, string>;
}
```
And update the function signature to destructure `locationColorMap` from props, removing the internal `buildLocationColorMap` call and its import.

**Step 2: Build frontend to verify**

Run: `cd /Users/devin/repo/cartographer/frontend && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add frontend/src/app/routes/races/race.tsx frontend/src/features/races/components/race-detail.tsx
git commit -m "Wire locationColorMap from race page to child components"
```

---

### Task 7: Add location usage stats to RaceDetail

**Files:**
- Modify: `frontend/src/features/races/components/race-detail.tsx`
- Modify: `frontend/src/features/routes/api/get-routes.ts` (if needed for data access)

**Step 1: Pass routes data to RaceDetail**

In `frontend/src/app/routes/races/race.tsx`:

1. Import `useRoutes`:
```typescript
import { useRoutes } from '@/features/routes/api/get-routes';
```

2. Add hook call inside the component (after `useRace`):
```typescript
const { data: routes } = useRoutes(raceId);
```

3. Pass routes to RaceDetail:
```tsx
<RaceDetail race={race} locationColorMap={locationColorMap} routes={routes} />
```

**Step 2: Update RaceDetail to show usage stats**

In `frontend/src/features/races/components/race-detail.tsx`:

1. Add import:
```typescript
import type { RouteSummary } from '@/types/api';
import { abbreviateLocation } from '@/utils/location';
```

2. Update interface:
```typescript
interface RaceDetailProps {
  race: Race;
  locationColorMap: Map<number, string>;
  routes?: RouteSummary[];
}
```

3. Update function signature:
```typescript
export function RaceDetail({ race, locationColorMap, routes }: RaceDetailProps) {
```

4. Compute usage counts inside the component:
```typescript
const locationUsage = new Map<number, number>();
if (routes) {
  for (const route of routes) {
    for (const loc of route.location_sequence) {
      locationUsage.set(loc.id, (locationUsage.get(loc.id) || 0) + 1);
    }
  }
}
```

5. After the Location Pool section (after the closing `</div>` on line 90), add:
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

**Step 3: Build frontend to verify**

Run: `cd /Users/devin/repo/cartographer/frontend && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add frontend/src/app/routes/races/race.tsx frontend/src/features/races/components/race-detail.tsx
git commit -m "Add location usage stats to race detail card"
```

---

### Task 8: Run full test suite and verify visually

**Step 1: Run backend tests**

Run: `cd /Users/devin/repo/cartographer && bundle exec rspec`
Expected: All pass

**Step 2: Build frontend**

Run: `cd /Users/devin/repo/cartographer/frontend && npm run build`
Expected: Build succeeds

**Step 3: Run E2E tests**

Run: `cd /Users/devin/repo/cartographer/e2e && npx playwright test --reporter=list`
Expected: All 17 tests pass

**Step 4: Visual verification with Playwright MCP**

Navigate to a race detail page to verify:
- Location pool badges have unique colors
- Each completed route shows a colored abbreviation path in a sub-row
- Location usage stats appear below the location pool
- Badge abbreviation tooltips or labels are readable

**Step 5: Update CLAUDE.md with learnings**

Add relevant gotchas or patterns discovered during implementation.

**Step 6: Commit any final adjustments**

```bash
git add -A
git commit -m "Final adjustments for route path visualization"
```
