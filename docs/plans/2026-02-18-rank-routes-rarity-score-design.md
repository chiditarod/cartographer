# Rank Routes Rarity Score — Design

## Overview

Add a new async job that evaluates all finalized (complete) routes for a race and calculates a **rarity score** for each route. The score measures how uncommon a route's checkpoint positions are relative to other finalized routes. Routes with rare location placements score higher.

## Database

Add a nullable `rarity_score` decimal column to the `routes` table:

```
routes.rarity_score  decimal(5,1), nullable, default: nil
```

- `nil` means "not yet ranked"
- Range: 0.0 (maximally common) to 100.0 (maximally rare)

## Algorithm

For a race with **N** complete routes and **S** intermediate checkpoint positions (CP 1 through CP `num_stops`):

1. **Build frequency matrix**: For each CP position `p` (1..S), count how many routes have each location at that position → `freq[position][location_id]`
2. **Score each route**: For each route, for each intermediate CP position `p`:
   - Get the location at position `p` from `location_sequence[p]`
   - `position_score = 1 - (freq[p][location_id] / N)`
3. **Sum**: `raw_score = sum of position_scores across all intermediate CPs`
4. **Normalize to 0–100**: `rarity_score = (raw_score / S) * 100`, rounded to 1 decimal

### Properties

- Only intermediate checkpoints are scored (start/finish excluded — they're fixed for all routes)
- A route where every CP is unique (freq=1) approaches 100 as N grows
- A route where every CP is maximally common scores near 0
- Identical paths score the same
- Score is a one-time snapshot — not auto-recalculated on route deletion

## Backend

### `RankRoutesJob` (`app/jobs/rank_routes_job.rb`)

- Accepts `(job_status_id, race_id)`
- Loads all complete routes with legs eager-loaded
- Sets `job_status.total = routes.count`
- Builds the frequency matrix in a single pass over all routes
- Iterates routes, computes rarity score, updates `route.rarity_score`, ticks progress
- On completion: `job_status.complete!(message: "Ranked #{count} routes")`
- On error: `job_status.fail!(message: e.message)`

### Operations Controller — new `rank_routes` action

- Creates `JobStatus` with `job_type: 'rank_routes'`
- Enqueues `RankRoutesJob.perform_later(job_status.id, race.id)`
- Returns `{ job_status_id: }` with 202 Accepted

### Route Serialization

- Include `rarity_score` in the `serialize_route` JSON response

### Routing

- `POST /api/v1/races/:id/operations/rank_routes`

## Frontend

### Operation Panel (`operation-panel.tsx`)

- **Reorder buttons** to: Geocode Locations → Generate Legs → Generate Routes → **Rank Routes**
- New "Rank Routes" button triggers `POST /api/v1/races/:id/operations/rank_routes`
- New job poller for the rank_routes job status
- Button disabled when any job is running (existing `isAnyRunning` pattern)

### Routes List

- Add a "Rarity" column to the routes table
- Show `rarity_score` value (or "—" if null/not yet ranked)
- Column is sortable

### API Layer

- New `rank-routes.ts` API function in `frontend/src/features/operations/api/`
- Update route types to include `rarity_score: number | null`

## Testing

### RSpec

- **RankRoutesJob**: Create a race with known routes and verify computed scores match expected values
- **Operations controller**: Verify `rank_routes` action creates job status and enqueues job
- **Routes controller**: Verify `rarity_score` appears in serialized response

### Playwright E2E

- Verify Rank Routes button appears in operation panel
- Verify button order: Geocode, Legs, Routes, Rank
- Verify button can be clicked and job runs

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Score aggregation | Sum | Routes with more rare placements across all CPs get higher scores |
| Positions included | Intermediates only (CP 1..N) | Start/finish are fixed for a race, don't contribute to uniqueness |
| Recalculation | One-time snapshot | Matches existing job patterns; re-run to refresh |
| Formula | Inverse proportion (1 - count/total) | Intuitive 0–1 scale per position, sums cleanly |
| Normalization | Divide by S, multiply by 100 | Consistent 0–100 scale regardless of num_stops |
| Storage | Nullable decimal(5,1) | Null = not ranked yet; one decimal place precision |
| Architecture | Dedicated job class | Consistent with existing GenerateLegsJob / GenerateRoutesJob patterns |
| Display | Column in routes list | Simple, sortable, informative |
