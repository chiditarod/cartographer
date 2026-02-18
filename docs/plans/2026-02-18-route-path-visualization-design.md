# Route Path Visualization & Location Usage Stats

## Overview

Add two features to the race detail page (`/races/:id`):

1. **Route path visualization** — Each completed route displays as a sequence of colored abbreviation badges (e.g., `[CL] → [RP] → [5S] → [PMI] → [CL]`) in a sub-row below its table entry.
2. **Location usage stats** — The race info card shows how many times each location appears across all completed routes, calculated entirely on the frontend.

## Backend Change

Add `location_sequence` to the route summary serialization in `RoutesController#index`. The index action already eager-loads `legs: [:start, :finish]`, so no extra queries are needed.

```ruby
location_sequence: [array of { id, name } representing the ordered locations in the route]
```

Built from leg start locations + the final leg's finish location.

## Frontend Changes

### Utility: `abbreviateLocation(name: string): string`

Splits on whitespace, takes first character of each word. "Phyllis' Musical Inn" → "PMI".

### Unique Location Colors

A palette of 12+ distinct Tailwind-compatible color pairs (background + text). Each location in a race's pool is assigned a color by its index position, replacing the current uniform blue `variant="info"` badges.

The color mapping is built from the race's `locations` array (which is ordered by name from the API), so colors are stable and consistent across the location pool, route paths, and usage stats.

### Route Path Sub-Rows

In the routes table, each route row is followed by a sub-row (colspan spanning all columns) that renders the location sequence as colored abbreviation badges connected by `→` arrows. Badge colors match the location pool colors.

### Location Usage Stats

New section in the `RaceDetail` card, after "Location Pool". Shows each location badge with a count of appearances across all completed routes. Computed from `location_sequence` data passed in from the routes list.

## Data Flow

1. Race detail page loads race data (includes `locations` array) and routes list (now includes `location_sequence`)
2. A color map is built: `locationId → colorClasses` based on position in `race.locations`
3. Location pool renders with unique-colored badges
4. Routes table renders sub-rows with colored abbreviation badges
5. Usage stats are computed by counting location appearances across all route sequences
