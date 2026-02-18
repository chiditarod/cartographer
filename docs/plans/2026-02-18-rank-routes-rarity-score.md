# Rank Routes Rarity Score — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Rank Routes" async job that calculates a rarity score (0–100) for each finalized route, stored in the DB, launched via a new button in the operations panel, and displayed as a sortable column in the routes list.

**Architecture:** New `RankRoutesJob` follows existing job patterns (like `GenerateLegsJob`). The rarity formula uses inverse proportion of location frequency at each intermediate checkpoint position, summed across positions and normalized to 0–100. A new `rarity_score` decimal column on routes stores the result. Frontend adds a fourth operation button and a new column in the routes table.

**Tech Stack:** Rails 8.0 / Ruby 3.4.8 / PostgreSQL / React 19 / TypeScript / TanStack Query v5 / Tailwind CSS

---

### Task 1: Add `rarity_score` column to routes table

**Files:**
- Create: `db/migrate/XXXXXX_add_rarity_score_to_routes.rb`
- Modify: `db/schema.rb` (auto-updated by migration)

**Step 1: Generate the migration**

Run:
```bash
cd /Users/devin/repo/cartographer && bin/rails generate migration AddRarityScoreToRoutes rarity_score:decimal
```

**Step 2: Edit the migration to set precision/scale**

The generated migration file will be at `db/migrate/*_add_rarity_score_to_routes.rb`. Edit it to:

```ruby
class AddRarityScoreToRoutes < ActiveRecord::Migration[8.0]
  def change
    add_column :routes, :rarity_score, :decimal, precision: 5, scale: 1
  end
end
```

The column is nullable by default (nil = "not yet ranked"). No default value needed.

**Step 3: Run the migration**

Run:
```bash
cd /Users/devin/repo/cartographer && bin/rails db:migrate
```
Expected: Migration runs successfully, `db/schema.rb` is updated with the new column.

**Step 4: Verify schema**

Check that `db/schema.rb` now has `t.decimal "rarity_score", precision: 5, scale: 1` inside the `routes` table.

**Step 5: Run existing tests to verify nothing broke**

Run:
```bash
cd /Users/devin/repo/cartographer && bundle exec rspec --format progress
```
Expected: All 163+ tests pass.

**Step 6: Commit**

```bash
git add db/migrate/*_add_rarity_score_to_routes.rb db/schema.rb
git commit -m "Add rarity_score column to routes table"
```

---

### Task 2: Create `RankRoutesJob` with TDD

**Files:**
- Create: `spec/jobs/rank_routes_job_spec.rb`
- Create: `app/jobs/rank_routes_job.rb`

**Step 1: Write the failing test**

Create `spec/jobs/rank_routes_job_spec.rb`:

```ruby
# frozen_string_literal: true

require 'rails_helper'

RSpec.describe RankRoutesJob, type: :job do
  describe '#perform' do
    let(:race) { FactoryBot.create(:race, num_stops: 2) }
    let(:job_status) do
      JobStatus.create!(job_type: 'rank_routes', status: 'running')
    end

    it 'calculates rarity scores for complete routes' do
      # Create 3 routes with different checkpoint sequences
      # Route structure: start -> CP1 -> CP2 -> finish (num_stops=2 means 3 legs)
      # location_sequence indices: [0]=start, [1]=CP1, [2]=CP2, [3]=finish
      # Only indices 1 and 2 are intermediate CPs

      loc_a = FactoryBot.create(:location)
      loc_b = FactoryBot.create(:location)
      loc_c = FactoryBot.create(:location)

      race.locations = [race.start, race.finish, loc_a, loc_b, loc_c]

      # Route 1: start -> A -> B -> finish
      route1 = Route.create!(race: race)
      leg1a = Leg.create!(start: race.start, finish: loc_a, distance: 1609)
      leg1b = Leg.create!(start: loc_a, finish: loc_b, distance: 1609)
      leg1c = Leg.create!(start: loc_b, finish: race.finish, distance: 1609)
      route1.legs << leg1a
      route1.legs << leg1b
      route1.legs << leg1c
      route1.save!
      expect(route1.complete).to be true

      # Route 2: start -> A -> C -> finish
      route2 = Route.create!(race: race)
      leg2a = Leg.find_or_create_by!(start: race.start, finish: loc_a) { |l| l.distance = 1609 }
      leg2b = Leg.create!(start: loc_a, finish: loc_c, distance: 1609)
      leg2c = Leg.create!(start: loc_c, finish: race.finish, distance: 1609)
      route2.legs << leg2a
      route2.legs << leg2b
      route2.legs << leg2c
      route2.save!
      expect(route2.complete).to be true

      # Route 3: start -> B -> C -> finish
      route3 = Route.create!(race: race)
      leg3a = Leg.create!(start: race.start, finish: loc_b, distance: 1609)
      leg3b = Leg.find_or_create_by!(start: loc_b, finish: loc_c) { |l| l.distance = 1609 }
      leg3c = Leg.find_or_create_by!(start: loc_c, finish: race.finish) { |l| l.distance = 1609 }
      route3.legs << leg3a
      route3.legs << leg3b
      route3.legs << leg3c
      route3.save!
      expect(route3.complete).to be true

      # N = 3 routes, S = 2 intermediate CPs
      # Frequency matrix:
      #   CP1: A appears 2x, B appears 1x
      #   CP2: B appears 1x, C appears 2x
      #
      # Route 1 (A at CP1, B at CP2):
      #   CP1 score = 1 - 2/3 = 0.333...
      #   CP2 score = 1 - 1/3 = 0.666...
      #   raw = 1.0, normalized = (1.0 / 2) * 100 = 50.0
      #
      # Route 2 (A at CP1, C at CP2):
      #   CP1 score = 1 - 2/3 = 0.333...
      #   CP2 score = 1 - 2/3 = 0.333...
      #   raw = 0.666..., normalized = (0.666... / 2) * 100 = 33.3
      #
      # Route 3 (B at CP1, C at CP2):
      #   CP1 score = 1 - 1/3 = 0.666...
      #   CP2 score = 1 - 2/3 = 0.333...
      #   raw = 1.0, normalized = (1.0 / 2) * 100 = 50.0

      RankRoutesJob.perform_now(job_status.id, race.id)

      route1.reload
      route2.reload
      route3.reload

      expect(route1.rarity_score).to eq(50.0)
      expect(route2.rarity_score).to eq(33.3)
      expect(route3.rarity_score).to eq(50.0)
    end

    it 'updates job status on completion' do
      # Create one simple complete route
      loc_a = FactoryBot.create(:location)
      loc_b = FactoryBot.create(:location)
      race.locations = [race.start, race.finish, loc_a, loc_b]

      route = Route.create!(race: race)
      route.legs << Leg.create!(start: race.start, finish: loc_a, distance: 1609)
      route.legs << Leg.create!(start: loc_a, finish: loc_b, distance: 1609)
      route.legs << Leg.create!(start: loc_b, finish: race.finish, distance: 1609)
      route.save!

      RankRoutesJob.perform_now(job_status.id, race.id)

      job_status.reload
      expect(job_status.status).to eq('completed')
      expect(job_status.total).to eq(1)
      expect(job_status.progress).to eq(1)
      expect(job_status.message).to match(/Ranked 1 route/)
    end

    it 'handles errors and marks job as failed' do
      allow(Race).to receive(:find).and_raise(ActiveRecord::RecordNotFound)

      expect {
        RankRoutesJob.perform_now(job_status.id, race.id)
      }.to raise_error(ActiveRecord::RecordNotFound)

      job_status.reload
      expect(job_status.status).to eq('failed')
    end

    it 'skips races with no complete routes' do
      # No routes created
      RankRoutesJob.perform_now(job_status.id, race.id)

      job_status.reload
      expect(job_status.status).to eq('completed')
      expect(job_status.message).to match(/Ranked 0 routes/)
    end
  end
end
```

**Step 2: Run the test to verify it fails**

Run:
```bash
cd /Users/devin/repo/cartographer && bundle exec rspec spec/jobs/rank_routes_job_spec.rb --format documentation
```
Expected: FAIL — `uninitialized constant RankRoutesJob`

**Step 3: Implement `RankRoutesJob`**

Create `app/jobs/rank_routes_job.rb`:

```ruby
# frozen_string_literal: true

class RankRoutesJob < ApplicationJob
  queue_as :default

  def perform(job_status_id, race_id)
    job_status = JobStatus.find(job_status_id)
    race = Race.find(race_id)

    routes = race.routes.complete.includes(legs: [:start, :finish])
    n = routes.size
    job_status.update!(total: n)

    if n == 0
      job_status.complete!(message: "Ranked 0 routes")
      return
    end

    num_stops = race.num_stops

    begin
      # Build location sequences for all routes
      sequences = routes.map do |r|
        locations = r.legs.map { |l| l.start.id } + [r.legs.last.finish.id]
        # Only intermediate CPs: indices 1..num_stops (skip index 0=start, skip last=finish)
        locations[1..num_stops]
      end

      # Build frequency matrix: freq[position_index][location_id] = count
      freq = Array.new(num_stops) { Hash.new(0) }
      sequences.each do |seq|
        seq.each_with_index do |loc_id, pos|
          freq[pos][loc_id] += 1
        end
      end

      # Score each route
      routes.each_with_index do |route, i|
        seq = sequences[i]
        raw_score = seq.each_with_index.sum do |loc_id, pos|
          1.0 - (freq[pos][loc_id].to_f / n)
        end
        normalized = (raw_score / num_stops) * 100
        route.update_column(:rarity_score, normalized.round(1))
        job_status.tick!(message: "Scored route #{i + 1}/#{n}")
      end

      job_status.complete!(message: "Ranked #{n} route#{'s' unless n == 1}")
    rescue => e
      job_status.fail!(message: e.message)
      raise
    end
  end
end
```

Key implementation notes:
- Uses `update_column` to bypass validations/callbacks (we don't want to re-trigger `set_complete_bool` etc.)
- `sequences[i]` extracts only intermediate CP location IDs (indices 1 through `num_stops`)
- `freq[pos][loc_id]` counts how many routes have a given location at a given position
- Formula: `(sum of (1 - count/N) for each CP) / S * 100`

**Step 4: Run the test to verify it passes**

Run:
```bash
cd /Users/devin/repo/cartographer && bundle exec rspec spec/jobs/rank_routes_job_spec.rb --format documentation
```
Expected: All 4 tests pass.

**Step 5: Run full test suite**

Run:
```bash
cd /Users/devin/repo/cartographer && bundle exec rspec --format progress
```
Expected: All tests pass.

**Step 6: Commit**

```bash
git add spec/jobs/rank_routes_job_spec.rb app/jobs/rank_routes_job.rb
git commit -m "Add RankRoutesJob with rarity score calculation"
```

---

### Task 3: Add `rank_routes` controller action and route

**Files:**
- Modify: `app/controllers/api/v1/operations_controller.rb` (add `rank_routes` action after `geocode`)
- Modify: `config/routes.rb` (add route)
- Modify: `spec/requests/api/v1/operations_spec.rb` (add test)

**Step 1: Write the failing test**

Add to `spec/requests/api/v1/operations_spec.rb` before the final `end`:

```ruby
  describe 'POST /api/v1/races/:race_id/rank_routes' do
    it 'creates a job status and returns its id' do
      race = FactoryBot.create(:race, :with_locations)

      post "/api/v1/races/#{race.id}/rank_routes"
      expect(response).to have_http_status(:accepted)
      json = JSON.parse(response.body)
      expect(json).to have_key('job_status_id')

      job_status = JobStatus.find(json['job_status_id'])
      expect(job_status.job_type).to eq('rank_routes')
    end
  end
```

**Step 2: Run the test to verify it fails**

Run:
```bash
cd /Users/devin/repo/cartographer && bundle exec rspec spec/requests/api/v1/operations_spec.rb --format documentation
```
Expected: FAIL — routing error (no route matches)

**Step 3: Add the route**

In `config/routes.rb`, add inside the `resources :races` block, after the `post 'generate_routes'` line:

```ruby
        post 'rank_routes', to: 'operations#rank_routes'
```

The races block should now have:
```ruby
      resources :races do
        resources :routes, only: [:index, :show, :update, :destroy] do
          get 'export_csv', on: :collection
        end
        post 'generate_legs', to: 'operations#generate_legs'
        post 'generate_routes', to: 'operations#generate_routes'
        post 'rank_routes', to: 'operations#rank_routes'
        post 'duplicate', on: :member
      end
```

**Step 4: Add the controller action**

In `app/controllers/api/v1/operations_controller.rb`, add the `rank_routes` action after `geocode`:

```ruby
      def rank_routes
        race = Race.find(params[:race_id])

        job_status = JobStatus.create!(
          job_type: 'rank_routes',
          status: 'running',
          metadata: { race_id: race.id }
        )

        RankRoutesJob.perform_later(job_status.id, race.id)

        render json: { job_status_id: job_status.id }, status: :accepted
      end
```

**Step 5: Run the test to verify it passes**

Run:
```bash
cd /Users/devin/repo/cartographer && bundle exec rspec spec/requests/api/v1/operations_spec.rb --format documentation
```
Expected: All tests pass (including the new one).

**Step 6: Run full test suite**

Run:
```bash
cd /Users/devin/repo/cartographer && bundle exec rspec --format progress
```
Expected: All tests pass.

**Step 7: Commit**

```bash
git add app/controllers/api/v1/operations_controller.rb config/routes.rb spec/requests/api/v1/operations_spec.rb
git commit -m "Add rank_routes operation endpoint"
```

---

### Task 4: Include `rarity_score` in route serialization

**Files:**
- Modify: `app/controllers/api/v1/routes_controller.rb:73` (add to `serialize_route`)
- Modify: `spec/requests/api/v1/routes_spec.rb` (if exists, add assertion)

**Step 1: Add `rarity_score` to the route serializer**

In `app/controllers/api/v1/routes_controller.rb`, in the `serialize_route` method, add `rarity_score` to the data hash. Add it after the `created_at` line:

Find this in `serialize_route`:
```ruby
          created_at: r.created_at,
```

Replace with:
```ruby
          created_at: r.created_at,
          rarity_score: r.rarity_score,
```

**Step 2: Run full test suite to verify nothing broke**

Run:
```bash
cd /Users/devin/repo/cartographer && bundle exec rspec --format progress
```
Expected: All tests pass.

**Step 3: Commit**

```bash
git add app/controllers/api/v1/routes_controller.rb
git commit -m "Include rarity_score in route API serialization"
```

---

### Task 5: Add frontend API function and update types

**Files:**
- Create: `frontend/src/features/operations/api/rank-routes.ts`
- Modify: `frontend/src/types/api.ts` (add `rarity_score` to `RouteSummary`)

**Step 1: Update the `RouteSummary` type**

In `frontend/src/types/api.ts`, add `rarity_score` to the `RouteSummary` interface. Find:

```typescript
  created_at: string;
}
```

in the `RouteSummary` interface and replace with:

```typescript
  rarity_score: number | null;
  created_at: string;
}
```

**Step 2: Create the API function**

Create `frontend/src/features/operations/api/rank-routes.ts`:

```typescript
import { useMutation } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';

export function rankRoutes(
  raceId: number,
): Promise<{ job_status_id: number }> {
  return apiFetch<{ job_status_id: number }>(
    `/races/${raceId}/rank_routes`,
    { method: 'POST' },
  );
}

export function useRankRoutes() {
  return useMutation({
    mutationFn: rankRoutes,
  });
}
```

**Step 3: Verify frontend compiles**

Run:
```bash
cd /Users/devin/repo/cartographer/frontend && npm run build
```
Expected: Build succeeds with no errors.

**Step 4: Commit**

```bash
git add frontend/src/features/operations/api/rank-routes.ts frontend/src/types/api.ts
git commit -m "Add rank routes API function and rarity_score type"
```

---

### Task 6: Add "Rank Routes" button to operation panel and reorder buttons

**Files:**
- Modify: `frontend/src/features/operations/components/operation-panel.tsx`

**Step 1: Add imports for the new API hook**

Add this import alongside the existing operation imports:

```typescript
import { useRankRoutes } from '@/features/operations/api/rank-routes';
```

**Step 2: Add the mutation and poller**

Inside the `OperationPanel` component, after the existing `geocodePoller`:

```typescript
  const rankRoutes = useRankRoutes();
  const rankPoller = useJobPoller();
```

**Step 3: Update `isAnyRunning` to include `rankPoller`**

Change:
```typescript
  const isAnyRunning =
    legsPoller.isPolling || routesPoller.isPolling || geocodePoller.isPolling;
```
To:
```typescript
  const isAnyRunning =
    legsPoller.isPolling || routesPoller.isPolling || geocodePoller.isPolling || rankPoller.isPolling;
```

**Step 4: Add handler function**

After `handleGeocodeLocations`:

```typescript
  const handleRankRoutes = () => {
    rankPoller.reset();
    rankRoutes.mutate(raceId, {
      onSuccess: (data) => {
        rankPoller.startPolling(data.job_status_id);
      },
    });
  };
```

**Step 5: Update the useEffect to include the new poller**

Change the pollers array from:
```typescript
    const pollers = [legsPoller, routesPoller, geocodePoller];
```
To:
```typescript
    const pollers = [legsPoller, routesPoller, geocodePoller, rankPoller];
```

And update the dependency array to include:
```typescript
  }, [legsPoller.jobStatus, routesPoller.jobStatus, geocodePoller.jobStatus, rankPoller.jobStatus, legsPoller.isPolling, routesPoller.isPolling, geocodePoller.isPolling, rankPoller.isPolling, onJobComplete]);
```

**Step 6: Reorder buttons and add the new one**

Replace the entire button `<div className="flex flex-wrap gap-3">` section with:

```tsx
            <Button
              id="btn-geocode"
              onClick={handleGeocodeLocations}
              loading={geocodeLocations.isPending}
              disabled={isAnyRunning || !race}
            >
              Geocode Locations
            </Button>
            <Button
              id="btn-generate-legs"
              onClick={handleGenerateLegs}
              loading={generateLegs.isPending}
              disabled={isAnyRunning}
            >
              Generate Legs
            </Button>
            <Button
              id="btn-generate-routes"
              onClick={handleGenerateRoutes}
              loading={generateRoutes.isPending}
              disabled={isAnyRunning}
            >
              Generate Routes
            </Button>
            <Button
              id="btn-rank-routes"
              onClick={handleRankRoutes}
              loading={rankRoutes.isPending}
              disabled={isAnyRunning}
            >
              Rank Routes
            </Button>
            {routes && routes.length > 0 && (
              <Button
                id="delete-all-routes-btn"
                variant="danger"
                onClick={() => setShowDeleteAllRoutes(true)}
                disabled={isAnyRunning}
              >
                Delete All Routes
              </Button>
            )}
```

**Step 7: Add job progress display for rank routes**

After the geocode poller display block, add:

```tsx
          {(rankPoller.jobStatus || rankPoller.isPolling) && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Rank Routes</p>
              <JobProgress
                jobStatus={rankPoller.jobStatus}
                isPolling={rankPoller.isPolling}
              />
            </div>
          )}
```

**Step 8: Verify frontend compiles**

Run:
```bash
cd /Users/devin/repo/cartographer/frontend && npm run build
```
Expected: Build succeeds.

**Step 9: Commit**

```bash
git add frontend/src/features/operations/components/operation-panel.tsx
git commit -m "Add Rank Routes button and reorder operation buttons"
```

---

### Task 7: Add rarity score column to routes list

**Files:**
- Modify: `frontend/src/features/routes/components/routes-list.tsx`

**Step 1: Add column header**

In the `<thead>` section, add a new `<th>` after the "Legs" column header and before "Actions":

```tsx
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rarity
            </th>
```

**Step 2: Update colSpan for the path badges row**

Change:
```typescript
  const colSpan = selectable ? 5 : 4;
```
To:
```typescript
  const colSpan = selectable ? 6 : 5;
```

**Step 3: Add data cell**

In the route row `<tr>`, add a new `<td>` after the Legs cell and before the Actions cell:

```tsx
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {route.rarity_score !== null ? route.rarity_score : '—'}
                </td>
```

**Step 4: Verify frontend compiles**

Run:
```bash
cd /Users/devin/repo/cartographer/frontend && npm run build
```
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add frontend/src/features/routes/components/routes-list.tsx
git commit -m "Add rarity score column to routes list"
```

---

### Task 8: Update E2E seed data and write E2E tests

**Files:**
- Modify: `e2e/tests/seeded/operations.spec.ts` (add test for rank routes button)

**Step 1: Add E2E test for Rank Routes button**

Add this test to `e2e/tests/seeded/operations.spec.ts` inside the `test.describe('Operations')` block:

```typescript
  test('ranks routes for a race', async ({ page }) => {
    await test.step('navigate to race detail', async () => {
      await page.goto('/races');
      await page.getByRole('link', { name: 'View' }).first().click();
      await expect(page.locator('#race-page-title')).toContainText(/E2E Race/, { timeout: 10000 });
    });

    await test.step('verify button order', async () => {
      const buttons = page.locator('.flex.flex-wrap.gap-3 button:not([id="delete-all-routes-btn"])');
      await expect(buttons.nth(0)).toHaveText('Geocode Locations');
      await expect(buttons.nth(1)).toHaveText('Generate Legs');
      await expect(buttons.nth(2)).toHaveText('Generate Routes');
      await expect(buttons.nth(3)).toHaveText('Rank Routes');
    });

    await test.step('trigger rank routes', async () => {
      await page.locator('#btn-rank-routes').click();
    });

    await test.step('wait for completion', async () => {
      await expect(page.locator('[data-testid="progress-bar"]').getByText(/completed/i)).toBeVisible({ timeout: 30000 });
    });
  });
```

**Step 2: Run the E2E tests**

Run:
```bash
cd /Users/devin/repo/cartographer/e2e && npx playwright test --project=seeded tests/seeded/operations.spec.ts --reporter=list
```
Expected: All operations tests pass (including the new rank routes test).

**Step 3: Commit**

```bash
git add e2e/tests/seeded/operations.spec.ts
git commit -m "Add E2E test for rank routes operation"
```

---

### Task 9: Verify with Playwright MCP and manual check

**Step 1: Build the frontend**

Run:
```bash
cd /Users/devin/repo/cartographer/frontend && npm run build
```

**Step 2: Use Playwright MCP to verify the UI**

Navigate to a race detail page and verify:
1. Button order is: Geocode Locations, Generate Legs, Generate Routes, Rank Routes
2. Click "Rank Routes" — job progress appears and completes
3. Navigate to routes list — "Rarity" column is visible with score values

**Step 3: Run full test suites**

Run:
```bash
cd /Users/devin/repo/cartographer && bundle exec rspec --format progress
```

Run:
```bash
cd /Users/devin/repo/cartographer/e2e && npx playwright test --reporter=list
```

Expected: All tests pass.

---

### Task 10: Update CLAUDE.md and README.md

**Files:**
- Modify: `CLAUDE.md` (add gotchas about rarity score)
- Modify: `README.md` (if any new setup/commands)

**Step 1: Add gotcha to CLAUDE.md**

Add to the Key Gotchas section:
- `rarity_score` uses `update_column` to bypass Route model callbacks — direct DB write
- Rank Routes job scores only intermediate CPs (indices 1..num_stops from location_sequence)
- Rarity score is a one-time snapshot — re-run job to refresh after route deletion

**Step 2: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "Update CLAUDE.md with rank routes gotchas"
```
