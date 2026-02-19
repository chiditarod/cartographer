# Auto-Select Routes — Design

## Summary

Add an "Auto-Select" button to the operations bar that automatically selects N routes providing the most balanced distribution of locations across checkpoint positions. Uses a greedy iterative algorithm via a synchronous API call.

## API Endpoint

**`POST /api/v1/races/:race_id/auto_select`** with body `{ count: N }`

- Synchronous — returns `{ route_ids: [1, 2, 3, ...] }`
- Validation: `count` must be > 0 and <= number of complete routes
- Returns 422 with error if validation fails
- Lives in `OperationsController`

## Algorithm — `RouteBalancer` Service

Greedy iterative selection:

1. Load all complete routes with their `location_sequence` data
2. Initialize empty frequency matrix: `position → location → count`
3. For each slot 1..N:
   a. For each unselected route, simulate adding it
   b. Compute imbalance score = sum across all positions of `(max_freq - min_freq)` at that position
   c. Pick route producing the lowest imbalance score
   d. Add to selected set, update frequency matrix
4. Return selected route IDs

Complexity: O(N * M * P) where N = target, M = total routes, P = checkpoint count. Sub-second for typical sizes.

## Frontend

### Auto-Select Button
- Added to `OperationPanel`, right of Rank Routes
- Same styling as existing operation buttons
- Disabled while any async job is running

### Auto-Select Modal
- Triggered on button click
- Numeric input: "Number of routes to select"
- Validation: integer > 0 and <= total complete routes (shown as helper text)
- Inline error message below input
- "Select" and "Cancel" buttons
- Uses existing `Modal` component

### State Flow
1. Button click → open modal
2. User enters count → Submit → `POST /api/v1/races/:id/auto_select`
3. On success: `setSelectedRouteIds(new Set(response.route_ids))` — replaces all selections
4. Close modal
5. `SelectionFrequencyMatrix` auto-updates from `selectedRouteIds`

## File Changes

| Layer | File | Change |
|-------|------|--------|
| Backend | `app/services/route_balancer.rb` | New service with greedy algorithm |
| Backend | `app/controllers/api/v1/operations_controller.rb` | Add `auto_select` action |
| Backend | `config/routes.rb` | Add route for `auto_select` |
| Backend | `spec/services/route_balancer_spec.rb` | Unit tests for algorithm |
| Backend | `spec/requests/api/v1/operations_spec.rb` | Request spec for endpoint |
| Frontend | `frontend/src/features/operations/api/auto-select.ts` | API function + mutation hook |
| Frontend | `frontend/src/features/operations/components/operation-panel.tsx` | Add button + modal trigger |
| Frontend | `frontend/src/features/operations/components/auto-select-modal.tsx` | New modal component |
| Frontend | `frontend/src/app/routes/races/race.tsx` | Wire `onAutoSelect` callback to `setSelectedRouteIds` |

## Decisions

- **Synchronous** (not async job) — greedy algorithm is fast enough
- **Greedy iterative** — accounts for inter-route balance, unlike score-and-rank
- **Modal dialog** — consistent with existing delete confirmation pattern
