# Duplicate Race Feature Design

## Summary

Add a "Duplicate" button to the race detail page (`/races/:id`) that copies a race and its location associations, prepends "Copy of " to the name, excludes routes, and navigates to the new race.

## Backend

- `POST /api/v1/races/:id/duplicate` — custom member route
- Loads the original race, duplicates all scalar attributes (name, num_stops, max_teams, etc.)
- Copies the HABTM `locations` association
- Sets name to `"Copy of #{original.name}"`
- Does NOT copy routes
- Returns the new race JSON with status 201

## Frontend

- `useDuplicateRace` mutation hook in `features/races/api/duplicate-race.ts`
- Button added to `race.tsx` between Edit and Delete: `variant="secondary"`, shows loading spinner
- On success: `navigate('/races/<newId>')`
- No confirmation modal (non-destructive action)

## Button Order

Edit (secondary) | Duplicate (secondary) | Delete (danger)
