# Checkpoint Position Usage Heat-Map

## Goal

Replace the "Location Usage in Routes" section in the race detail card with a table showing how many times each location appears at each checkpoint position across all routes. Per-column heat-map coloring highlights rare placements (green) vs common ones (red), helping users identify unique route configurations.

## Data Computation

- Source: `routes[].location_sequence` (already available via props)
- Skip index 0 (start) and last index (finish) — only intermediate checkpoints
- Build `Map<locationId, Map<position, count>>`
- Column count = `race.num_stops`

## Table Layout

| Location | CP 1 | CP 2 | CP 3 |
|----------|------|------|------|
| Badge    | count| count| count|

- Location column: colored `Badge` using `locationColorMap`
- Count cells: heat-map background with per-column scaling

## Heat-Map Colors

HSL interpolation per column:
- Low (min in column): `hsl(120, 40%, 90%)` — soft green
- Mid: `hsl(45, 50%, 85%)` — soft yellow
- High (max in column): `hsl(0, 45%, 88%)` — soft red
- All equal: neutral gray

## Visibility

Show only when routes with location sequences exist (same guard as current implementation).

## Files Changed

- `frontend/src/features/races/components/race-detail.tsx`

## Exclusions

- No API changes
- No new components (table is small enough to inline)
- Start and finish positions excluded from stats
