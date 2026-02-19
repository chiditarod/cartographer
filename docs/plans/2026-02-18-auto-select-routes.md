# Auto-Select Routes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an "Auto-Select" button that calls a synchronous API to pick the N most balanced routes across checkpoint positions, then checks them in the UI.

**Architecture:** New `RouteBalancer` service with greedy iterative algorithm, called synchronously from `OperationsController#auto_select`. Frontend adds button + modal to `OperationPanel`, wires result into existing `selectedRouteIds` state.

**Tech Stack:** Rails service, RSpec, React + TypeScript, TanStack React Query mutation

---

### Task 1: RouteBalancer Service (Backend)

**Files:**
- Create: `app/services/route_balancer.rb`
- Create: `spec/services/route_balancer_spec.rb`

**Step 1: Write the failing tests**

```ruby
# spec/services/route_balancer_spec.rb
# frozen_string_literal: true

require 'rails_helper'

RSpec.describe RouteBalancer do
  describe '.call' do
    it 'returns the requested number of route IDs' do
      race = FactoryBot.create(:race, :with_locations, num_stops: 2)
      routes = Array.new(5) { FactoryBot.create(:sequential_route, race: race) }

      result = RouteBalancer.call(race, 3)

      expect(result).to be_an(Array)
      expect(result.size).to eq(3)
      expect(result).to all(be_a(Integer))
      expect(result - routes.map(&:id)).to be_empty
    end

    it 'returns all routes when count equals total' do
      race = FactoryBot.create(:race, :with_locations, num_stops: 2)
      routes = Array.new(3) { FactoryBot.create(:sequential_route, race: race) }

      result = RouteBalancer.call(race, 3)

      expect(result.sort).to eq(routes.map(&:id).sort)
    end

    it 'returns empty array when count is 0' do
      race = FactoryBot.create(:race, :with_locations, num_stops: 2)
      FactoryBot.create(:sequential_route, race: race)

      result = RouteBalancer.call(race, 0)

      expect(result).to eq([])
    end

    it 'only considers complete routes' do
      race = FactoryBot.create(:race, :with_locations, num_stops: 2)
      complete = FactoryBot.create(:sequential_route, race: race)
      FactoryBot.create(:incomplete_route, race: race)

      result = RouteBalancer.call(race, 1)

      expect(result).to eq([complete.id])
    end
  end
end
```

**Step 2: Run tests to verify they fail**

Run: `bundle exec rspec spec/services/route_balancer_spec.rb`
Expected: FAIL — `uninitialized constant RouteBalancer`

**Step 3: Implement RouteBalancer service**

```ruby
# app/services/route_balancer.rb
# frozen_string_literal: true

class RouteBalancer
  # Selects `count` routes from the race's complete routes that provide
  # the most balanced distribution of locations across checkpoint positions.
  #
  # Uses a greedy iterative algorithm:
  # 1. Start with empty selection and zero-frequency matrix
  # 2. For each slot, pick the route that minimizes total imbalance
  # 3. Imbalance = sum across positions of (max_freq - min_freq)
  #
  # Returns an array of route IDs.
  def self.call(race, count)
    return [] if count <= 0

    routes = race.routes.complete.includes(legs: [:start, :finish])
    return [] if routes.empty?

    num_stops = race.num_stops

    # Build location sequences for each route (intermediate CPs only)
    route_data = routes.map do |r|
      locations = r.legs.map { |l| l.start.id } + [r.legs.last.finish.id]
      { id: r.id, sequence: locations[1..num_stops] }
    end

    # Collect all unique location IDs at each position
    all_locations_at = Array.new(num_stops) { Set.new }
    route_data.each do |rd|
      rd[:sequence].each_with_index do |loc_id, pos|
        all_locations_at[pos].add(loc_id)
      end
    end

    # Greedy selection
    selected_ids = []
    selected_indices = Set.new
    freq = Array.new(num_stops) { Hash.new(0) }

    count.times do
      best_index = nil
      best_score = Float::INFINITY

      route_data.each_with_index do |rd, idx|
        next if selected_indices.include?(idx)

        # Simulate adding this route
        score = 0
        rd[:sequence].each_with_index do |loc_id, pos|
          simulated = freq[pos].dup
          simulated[loc_id] += 1
          values = simulated.values
          score += values.max - values.min
        end

        if score < best_score
          best_score = score
          best_index = idx
        end
      end

      break unless best_index

      # Commit selection
      selected_indices.add(best_index)
      selected_ids << route_data[best_index][:id]
      route_data[best_index][:sequence].each_with_index do |loc_id, pos|
        freq[pos][loc_id] += 1
      end
    end

    selected_ids
  end
end
```

**Step 4: Run tests to verify they pass**

Run: `bundle exec rspec spec/services/route_balancer_spec.rb`
Expected: PASS (all 4 examples)

**Step 5: Commit**

```bash
git add app/services/route_balancer.rb spec/services/route_balancer_spec.rb
git commit -m "Add RouteBalancer service with greedy selection algorithm"
```

---

### Task 2: API Endpoint (Backend)

**Files:**
- Modify: `app/controllers/api/v1/operations_controller.rb` (add `auto_select` action after `rank_routes` at line 53)
- Modify: `config/routes.rb` (add route at line 17, after `rank_routes`)
- Modify: `spec/requests/api/v1/operations_spec.rb` (add tests after line 60)

**Step 1: Write the failing tests**

Add to `spec/requests/api/v1/operations_spec.rb` after the `rank_routes` describe block (line 60):

```ruby
  describe 'POST /api/v1/races/:race_id/auto_select' do
    it 'returns selected route IDs' do
      race = FactoryBot.create(:race, :with_locations, num_stops: 2)
      routes = Array.new(3) { FactoryBot.create(:sequential_route, race: race) }

      post "/api/v1/races/#{race.id}/auto_select", params: { count: 2 }
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['route_ids']).to be_an(Array)
      expect(json['route_ids'].size).to eq(2)
    end

    it 'returns 422 when count exceeds complete routes' do
      race = FactoryBot.create(:race, :with_locations, num_stops: 2)
      FactoryBot.create(:sequential_route, race: race)

      post "/api/v1/races/#{race.id}/auto_select", params: { count: 5 }
      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json['error']).to be_present
    end

    it 'returns 422 when count is 0' do
      race = FactoryBot.create(:race, :with_locations, num_stops: 2)
      FactoryBot.create(:sequential_route, race: race)

      post "/api/v1/races/#{race.id}/auto_select", params: { count: 0 }
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it 'returns 422 when count is negative' do
      race = FactoryBot.create(:race, :with_locations, num_stops: 2)

      post "/api/v1/races/#{race.id}/auto_select", params: { count: -1 }
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end
```

**Step 2: Run tests to verify they fail**

Run: `bundle exec rspec spec/requests/api/v1/operations_spec.rb`
Expected: FAIL — routing error for `auto_select`

**Step 3: Add the route**

In `config/routes.rb`, add after line 16 (`post 'rank_routes'`):

```ruby
        post 'auto_select', to: 'operations#auto_select'
```

**Step 4: Add the controller action**

In `app/controllers/api/v1/operations_controller.rb`, add after the `rank_routes` method (after line 53):

```ruby
      def auto_select
        race = Race.find(params[:race_id])
        count = params[:count].to_i
        complete_count = race.routes.complete.count

        if count <= 0 || count > complete_count
          return render json: { error: "Count must be between 1 and #{complete_count}" }, status: :unprocessable_entity
        end

        route_ids = RouteBalancer.call(race, count)
        render json: { route_ids: route_ids }
      end
```

**Step 5: Run tests to verify they pass**

Run: `bundle exec rspec spec/requests/api/v1/operations_spec.rb`
Expected: PASS (all examples including existing ones)

**Step 6: Run full backend test suite**

Run: `bundle exec rspec`
Expected: All tests pass (187+ tests)

**Step 7: Commit**

```bash
git add app/controllers/api/v1/operations_controller.rb config/routes.rb spec/requests/api/v1/operations_spec.rb
git commit -m "Add POST /api/v1/races/:id/auto_select endpoint"
```

---

### Task 3: Frontend API Layer

**Files:**
- Create: `frontend/src/features/operations/api/auto-select.ts`

**Step 1: Create the API function and mutation hook**

Follow the exact pattern from `frontend/src/features/operations/api/rank-routes.ts`:

```typescript
// frontend/src/features/operations/api/auto-select.ts
import { useMutation } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';

interface AutoSelectParams {
  raceId: number;
  count: number;
}

interface AutoSelectResponse {
  route_ids: number[];
}

export function autoSelectRoutes(
  params: AutoSelectParams,
): Promise<AutoSelectResponse> {
  return apiFetch<AutoSelectResponse>(
    `/races/${params.raceId}/auto_select`,
    {
      method: 'POST',
      body: JSON.stringify({ count: params.count }),
    },
  );
}

export function useAutoSelectRoutes() {
  return useMutation({
    mutationFn: autoSelectRoutes,
  });
}
```

**Step 2: Verify frontend builds**

Run: `cd frontend && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add frontend/src/features/operations/api/auto-select.ts
git commit -m "Add frontend API layer for auto-select routes"
```

---

### Task 4: Auto-Select Modal Component

**Files:**
- Create: `frontend/src/features/operations/components/auto-select-modal.tsx`

**Step 1: Create the modal component**

Uses existing `Modal` and `Input` components. Pattern follows the delete confirmation modals:

```typescript
// frontend/src/features/operations/components/auto-select-modal.tsx
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

interface AutoSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (count: number) => void;
  isLoading: boolean;
  maxCount: number;
  error?: string;
}

export function AutoSelectModal({
  open,
  onClose,
  onSubmit,
  isLoading,
  maxCount,
  error,
}: AutoSelectModalProps) {
  const [value, setValue] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = () => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num <= 0 || num > maxCount) {
      setValidationError(`Enter a number between 1 and ${maxCount}`);
      return;
    }
    setValidationError('');
    onSubmit(num);
  };

  const handleClose = () => {
    setValue('');
    setValidationError('');
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Auto-Select Routes">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Select the number of routes to optimize for balanced checkpoint
          distribution.
        </p>
        <Input
          id="auto-select-count"
          label="Number of routes"
          type="number"
          min={1}
          max={maxCount}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setValidationError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          error={validationError || error}
          placeholder={`1 – ${maxCount}`}
        />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            id="btn-auto-select-submit"
            onClick={handleSubmit}
            loading={isLoading}
          >
            Select
          </Button>
        </div>
      </div>
    </Modal>
  );
}
```

**Step 2: Verify frontend builds**

Run: `cd frontend && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add frontend/src/features/operations/components/auto-select-modal.tsx
git commit -m "Add AutoSelectModal component"
```

---

### Task 5: Wire Up OperationPanel + Race Page

**Files:**
- Modify: `frontend/src/features/operations/components/operation-panel.tsx`
- Modify: `frontend/src/app/routes/races/race.tsx`

**Step 1: Update OperationPanel props and add Auto-Select button**

In `operation-panel.tsx`:

1. Add to imports (after line 10):
```typescript
import { useAutoSelectRoutes } from '@/features/operations/api/auto-select';
import { AutoSelectModal } from '@/features/operations/components/auto-select-modal';
```

2. Extend `OperationPanelProps` interface (line 16-18) to add:
```typescript
interface OperationPanelProps {
  raceId: number;
  onJobComplete?: () => void;
  onAutoSelect?: (routeIds: number[]) => void;
}
```

3. Inside the component function, after `const rankRoutes = useRankRoutes();` (line 31), add:
```typescript
  const autoSelect = useAutoSelectRoutes();
  const [showAutoSelect, setShowAutoSelect] = useState(false);
```

4. Add handler after `handleRankRoutes` (after line 82):
```typescript
  const handleAutoSelect = (count: number) => {
    autoSelect.mutate(
      { raceId, count },
      {
        onSuccess: (data) => {
          onAutoSelect?.(data.route_ids);
          setShowAutoSelect(false);
        },
      },
    );
  };

  const completeRouteCount = routes?.filter((r) => r.complete).length ?? 0;
```

5. Add button after the Rank Routes button (after line 152, before the conditional Delete All Routes):
```tsx
            <Button
              id="btn-auto-select"
              onClick={() => setShowAutoSelect(true)}
              disabled={isAnyRunning || completeRouteCount === 0}
            >
              Auto-Select
            </Button>
```

6. Add `AutoSelectModal` right before the closing `</Card>` tag (before line 234):
```tsx
      <AutoSelectModal
        open={showAutoSelect}
        onClose={() => {
          setShowAutoSelect(false);
          autoSelect.reset();
        }}
        onSubmit={handleAutoSelect}
        isLoading={autoSelect.isPending}
        maxCount={completeRouteCount}
        error={autoSelect.error?.message}
      />
```

**Step 2: Wire up race.tsx**

In `frontend/src/app/routes/races/race.tsx`, add `onAutoSelect` prop to the `OperationPanel` (line 170-178):

```tsx
        <OperationPanel
          raceId={raceId}
          onJobComplete={() => {
            queryClient.invalidateQueries({ queryKey: ['race', raceId] });
            queryClient.invalidateQueries({ queryKey: ['routes', raceId] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            setNotification('Operation completed successfully.');
          }}
          onAutoSelect={(routeIds) => {
            setSelectedRouteIds(new Set(routeIds));
          }}
        />
```

**Step 3: Verify frontend builds**

Run: `cd frontend && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add frontend/src/features/operations/components/operation-panel.tsx frontend/src/app/routes/races/race.tsx
git commit -m "Wire Auto-Select button into OperationPanel and race page"
```

---

### Task 6: Manual Smoke Test + Full Test Suite

**Step 1: Run full backend test suite**

Run: `bundle exec rspec`
Expected: All tests pass

**Step 2: Run frontend build**

Run: `cd frontend && npm run build`
Expected: Build succeeds

**Step 3: Run E2E tests**

Run: `cd e2e && npx playwright test --reporter=list`
Expected: All existing E2E tests pass (no regressions)

**Step 4: Update CLAUDE.md with key learnings**

Add to CLAUDE.md Key Gotchas:
- `RouteBalancer.call(race, count)` — synchronous greedy service, returns array of route IDs
- `POST /api/v1/races/:id/auto_select` with `{ count: N }` — synchronous, returns `{ route_ids: [...] }`
- Auto-Select button in OperationPanel uses `onAutoSelect` callback (not job polling) to update `selectedRouteIds`

**Step 5: Commit any updates**

```bash
git add CLAUDE.md
git commit -m "Update CLAUDE.md with Auto-Select learnings"
```
