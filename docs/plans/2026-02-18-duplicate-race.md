# Duplicate Race Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Duplicate" button to the race detail page that copies a race with its location associations (but not routes) and navigates to the new copy.

**Architecture:** Backend member route `POST /api/v1/races/:id/duplicate` duplicates the race record and HABTM locations. Frontend adds a button between Edit and Delete that calls this endpoint and navigates to the new race.

**Tech Stack:** Rails 8 API, React 19, TanStack React Query v5, React Router v7

---

### Task 1: Add duplicate route and controller action (backend)

**Files:**
- Modify: `config/routes.rb:8-12`
- Modify: `app/controllers/api/v1/races_controller.rb`

**Step 1: Write the failing request spec**

Add to `spec/requests/api/v1/races_spec.rb` after the DELETE block:

```ruby
describe 'POST /api/v1/races/:id/duplicate' do
  it 'duplicates a race with locations but not routes' do
    race = FactoryBot.create(:race, :with_locations, name: 'Original Race')
    # Create a route to verify it is NOT copied
    FactoryBot.create(:route, race: race)

    expect {
      post "/api/v1/races/#{race.id}/duplicate"
    }.to change(Race, :count).by(1)

    expect(response).to have_http_status(:created)
    json = JSON.parse(response.body)
    expect(json['name']).to eq('Copy of Original Race')
    expect(json['num_stops']).to eq(race.num_stops)
    expect(json['start_id']).to eq(race.start_id)
    expect(json['finish_id']).to eq(race.finish_id)
    expect(json['location_ids']).to match_array(race.location_ids)
    expect(json['route_count']).to eq(0)
  end
end
```

**Step 2: Run the test to verify it fails**

Run: `bundle exec rspec spec/requests/api/v1/races_spec.rb`
Expected: FAIL — no route matches

**Step 3: Add the route**

In `config/routes.rb`, inside the `resources :races` block, add:

```ruby
resources :races do
  resources :routes, only: [:index, :show, :update, :destroy]
  post 'generate_legs', to: 'operations#generate_legs'
  post 'generate_routes', to: 'operations#generate_routes'
  post 'duplicate', on: :member
end
```

**Step 4: Add the controller action**

In `app/controllers/api/v1/races_controller.rb`, add after the `destroy` action:

```ruby
def duplicate
  original = Race.find(params[:id])
  copy = original.dup
  copy.name = "Copy of #{original.name}"
  copy.save!
  copy.locations = original.locations
  render json: serialize_race(copy), status: :created
end
```

**Step 5: Run the test to verify it passes**

Run: `bundle exec rspec spec/requests/api/v1/races_spec.rb`
Expected: All 6 tests PASS

**Step 6: Commit**

```
git add config/routes.rb app/controllers/api/v1/races_controller.rb spec/requests/api/v1/races_spec.rb
git commit -m "Add POST /api/v1/races/:id/duplicate endpoint"
```

---

### Task 2: Add frontend mutation hook and duplicate button

**Files:**
- Create: `frontend/src/features/races/api/duplicate-race.ts`
- Modify: `frontend/src/app/routes/races/race.tsx`

**Step 1: Create the mutation hook**

Create `frontend/src/features/races/api/duplicate-race.ts`:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api-client';
import type { Race } from '@/types/api';

export function duplicateRace(id: number): Promise<Race> {
  return apiFetch<Race>(`/races/${id}/duplicate`, {
    method: 'POST',
  });
}

export function useDuplicateRace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: duplicateRace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['races'] });
    },
  });
}
```

**Step 2: Add the Duplicate button to `race.tsx`**

In `frontend/src/app/routes/races/race.tsx`:

1. Import the hook: `import { useDuplicateRace } from '@/features/races/api/duplicate-race';`
2. Add `const duplicateMutation = useDuplicateRace();` alongside existing mutations
3. Add the Duplicate button between Edit and Delete:

```tsx
<div className="flex gap-2">
  <Link to={`/races/${id}/edit`} id="edit-race-link">
    <Button variant="secondary">Edit</Button>
  </Link>
  <Button
    variant="secondary"
    loading={duplicateMutation.isPending}
    onClick={() => {
      duplicateMutation.mutate(raceId, {
        onSuccess: (newRace) => navigate(`/races/${newRace.id}`),
      });
    }}
  >
    Duplicate
  </Button>
  <Button
    variant="danger"
    onClick={() => setShowDeleteModal(true)}
  >
    Delete
  </Button>
</div>
```

**Step 3: Verify frontend builds**

Run: `cd frontend && npm run build`
Expected: Build succeeds with no errors

**Step 4: Commit**

```
git add frontend/src/features/races/api/duplicate-race.ts frontend/src/app/routes/races/race.tsx
git commit -m "Add Duplicate button to race detail page"
```

---

### Task 3: Verify with Playwright

**Step 1: Manual verification via Playwright MCP**

Navigate to a race detail page and verify:
- Button order is Edit | Duplicate | Delete
- Clicking Duplicate creates a new race named "Copy of ..."
- Browser navigates to the new race's detail page
- The new race has the same locations but no routes

No new E2E test file needed — this is a manual smoke test.
