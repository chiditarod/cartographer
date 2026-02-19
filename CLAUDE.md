> **First thing every session**: Read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full codebase map (models, API endpoints, services, frontend structure, data flow).

## Project Conventions

- Always use sub-agents when exploring a project's context or structure.
- Always use sub-agents and parallelism whenever it is safe to do so to increase throughput and reduce token use.
- Always use Context7 MCP when you need library/API documentation, code generation, setup or configuration steps without user explicitly asking.
- Always use Playwrite MCP when you need to verify UI changes without user explicitly asking.
- Use dogtag (`../dogtag`) for Playwright integration test patterns ONLY — NOT for UI style, UX, or design inspiration.
- Ensure the React app follows Bulletproof React standard (https://github.com/alan2207/bulletproof-react).
- Put key learnings into CLAUDE.md after every iteration.
- Once you finish a task, automatically commit all changes that your work made with a concise and descriptive message. ensure you do not commit changes that you did not make as part of that task.
- When asking the user for permission to execute a command, additionally prompt to "Always allow" to remember their choice for the session. Do not re-ask for the same type of command.
- NEVER run `git push` or try to open PRs. The user will push manually.
- After finishing each task, review and update README.md if the task introduced new setup steps, commands, or changed how things work.

## Tech Stack

- **Backend**: Rails 8.0 / Ruby 3.4.8 / PostgreSQL
- **Frontend**: React 19 + TypeScript + Vite 6 + Tailwind CSS 3.4
- **React architecture**: Bulletproof React (feature-based modules, unidirectional flow, no barrel files, kebab-case filenames)
- **Data fetching**: TanStack React Query v5
- **Routing**: React Router v7
- **API**: Namespaced `/api/v1/` with dedicated controllers
- **Async jobs**: Polling via `job_statuses` DB table
- **E2E tests**: Playwright (sequential, 1 worker, dual webServer: Rails 3099 + Vite 5199, per-test DB reset via fixtures)

## Key Gotchas

- `legs_routes` join table now has a primary key (added via migration) — `route.destroy!` works normally
- Project does NOT include `FactoryBot::Syntax::Methods` — always use `FactoryBot.create(:factory)`, not bare `create`
- Race model uses enum for `distance_unit` (`mi: 0, km: 1`)
- Keep `root 'home#index'` for existing specs; SPA catch-all only handles unmatched paths
- `RouteGenerator` is recursive and can be long-running
- `MOCK_MAP=true` env var enables mock mode for development without Google API key
- `GET /api/v1/geocode_search?query=...` endpoint for address search (supports MOCK_MAP)
- Never call side effects directly in React render body — always use useEffect
- Forms should accept `error` prop and display API errors; use `formatMutationError()` from utils
- Use `Modal` component instead of `window.confirm()` for destructive actions
- Compute `Number(id)` from `useParams` once at top of component, not inline
- Route `complete` boolean is set via `before_save` callback — after adding legs via association, must call `route.save!` to trigger it
- "Delete all" pattern: `params[:id] == 'all'` in destroy action (used by legs and routes controllers)
- "Bulk delete" pattern: `params[:id] == 'bulk'` with `params[:ids]` array in request body (routes controller)
- Filtered CSV export: `GET /api/v1/races/:id/routes/export_csv?ids=1,2,3` filters by route IDs
- E2E seed creates 2 complete routes (forward and reverse leg order) for route selection tests
- Route summary API includes `location_sequence` array of `{id, name}` for path visualization
- `buildLocationColorMap()` in `frontend/src/utils/location.ts` assigns unique colors to locations
- Badge component accepts optional `colorClasses` prop that overrides `variant` styling
- E2E seed must create complete routes (with legs) for route-related E2E tests to work
- E2E tests use per-test fixtures: `seededTest` (reset + seed) and `freshTest` (reset only) from `e2e/fixtures.ts`
- E2E tests are organized into `tests/seeded/` (need seed data) and `tests/fresh/` (create own data)
- DB reset/seed during E2E uses fast API endpoints (`POST /api/v1/e2e/reset` and `/e2e/seed`) instead of slow rake tasks — only available in test env
- **E2E locator best practice**: NEVER use `getByText()` or `getByRole({ name: '...' })` in E2E tests — always use `page.locator('#id')`, `page.locator('[data-testid="..."]')`, or `page.locator('[id^="prefix-"]')` for robustness against text changes. When adding new interactive elements, always include an `id` or `data-testid` attribute. Use `id` for unique elements (buttons, links, sections) and `data-testid` for repeated/structural elements (list tables, empty states, progress indicators).
- For operation progress checks use `[data-testid="progress-status"][data-status="completed"]` instead of text matching
- Operation progress sections have data-testids: `op-geocode-progress`, `op-generate-legs-progress`, `op-generate-routes-progress`, `op-rank-routes-progress`
- View links in lists use id pattern `view-{entity}-{id}` (e.g. `view-race-123`, `view-location-45`, `view-route-789`)
- Race creation in E2E must check location pool checkboxes — form validates `location_ids.length > 0`
- `POST /api/v1/races/:id/duplicate` duplicates a race with locations (not routes), prepends "Copy of " to name — uses `ActiveRecord#dup`
- Sidebar has two sections: main nav (Dashboard, Locations, Races) at top and Help pinned at bottom — add new primary nav to `navItems` array, secondary nav to the bottom `div`
- Race detail card "Checkpoint Position Usage" heat-map table uses `RouteSummary.location_sequence` — index 0 is start, last index is finish, intermediate indices are checkpoint positions (CP 1..N where N = `num_stops`)
- `RankRoutesJob` computes rarity scores for complete routes — uses `update_column(:rarity_score, ...)` to bypass Route validations/callbacks
- Rarity algorithm: for each intermediate CP position, score = 1 - (freq/N); normalize sum across positions to 0-100 scale
- Job pattern: wrap `Race.find` inside `begin...rescue` so `job_status.fail!` is called even if the race isn't found
- Operation button order: Geocode Locations → Generate Legs → Generate Routes → Rank Routes (matches logical workflow)
- Rarity score is a one-time snapshot — re-run Rank Routes job to refresh after route deletion
- Active Storage is configured for race logo uploads (PNG/JPEG only, max 5 MB) — `has_one_attached :logo` on Race model
- Logo upload uses FormData — `apiFetch` skips `Content-Type: application/json` header when body is FormData (browser sets multipart boundary)
- `buildRaceBody()` in `frontend/src/features/races/utils/build-race-form-data.ts` returns FormData when logo/deleteLogo present, JSON string otherwise
- Race controller handles `delete_logo` param in update to purge logo, and copies logo blob in duplicate
- `RoutePdfService` generates 8.5x11 PDF with Prawn: header (logo + names), map image, location table, footer (distance + rarity)
- PDF export endpoint: `GET /api/v1/races/:race_id/routes/:id/export_pdf` — returns single-route PDF
- Batch PDF export: `GET /api/v1/races/:race_id/routes/export_pdf?ids=1,2,3` — returns multi-page PDF (one page per route); `RoutePdfService.call_batch(routes)` handles batch rendering
- PDF map image: fetches from Google Static Maps URL or local file for MOCK_MAP mode; wraps in rescue for resilience
- `rails_blob_path(r.logo, only_path: true)` returns Active Storage blob URL for serialization
- Shared checkpoint frequency utils in `frontend/src/features/races/utils/checkpoint-frequency.ts` — `heatColor()`, `buildPositionUsage()`, `buildColBounds()` used by both `RaceDetail` and `SelectionFrequencyMatrix`
- Heat-map palettes are configurable via `HeatPalette` interface and `PALETTES` object — default is `ocean`; `verdant` (red→yellow→green) also available; pass palette as 4th arg to `heatColor()`
- `heatColor()` returns grey for zero values and a `uniform` color when all non-zero values in a column are identical
- `SelectionFrequencyMatrix` component filters routes by `selectedRouteIds` and renders a live heat-map — placed between OperationPanel and routes section in race page
- Race detail card uses compact horizontal stat strip (no CardHeader, no Distance Unit field) — stat values separated by pipe dividers with indigo left border accent
- No standalone `/races/:id/routes` page — routes list is only shown within the race detail page; route detail "Back to Race" links to `/races/:raceId`
- `RouteBalancer.call(race, count)` — synchronous greedy service, returns array of route IDs
- `POST /api/v1/races/:id/auto_select` with `{ count: N }` — synchronous, returns `{ route_ids: [...] }`
- Auto-Select button in OperationPanel uses `onAutoSelect` callback (not job polling) to update `selectedRouteIds`
- `LegDistanceStrip` component in route detail shows colored location badges connected by proportionally-sized arrows (linear scale); uses `buildLocationColorMap()` and `abbreviateLocation()` from `utils/location.ts`

## Commands

- `bundle exec rspec` — Run all RSpec tests (191 tests, all passing, ~84% coverage)
- `cd frontend && npm run build` — Build frontend (outputs to `../public/spa/`)
- `cd frontend && npm run dev` — Start Vite dev server
- `cd e2e && npx playwright test --reporter=list` — Run all Playwright E2E tests (23 tests: 21 seeded + 2 fresh)
- `cd e2e && npx playwright test --project=seeded` — Run only seeded E2E tests
- `cd e2e && npx playwright test --project=fresh` — Run only fresh E2E tests
