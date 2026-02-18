# Web UI Implementation Status

## Overview

Building a complete web UI for Cartographer (CHIditarod race route planner) to replace all Rails console workflows. React SPA + Rails JSON API + Playwright integration tests.

## What's Done

### Phase 1: Rails JSON API — COMPLETE

All endpoints working, 151 RSpec tests passing, 85% coverage.

**New files created:**
- `db/migrate/20260217000001_create_job_statuses.rb` — migration for async job tracking
- `app/models/job_status.rb` — JobStatus model with `tick!`, `complete!`, `fail!` helpers
- `app/controllers/api/v1/base_controller.rb` — base with error handling
- `app/controllers/api/v1/locations_controller.rb` — full CRUD
- `app/controllers/api/v1/races_controller.rb` — full CRUD with location pool assignment
- `app/controllers/api/v1/routes_controller.rb` — index, show, update (name), destroy (nested under races)
- `app/controllers/api/v1/legs_controller.rb` — index with race filter, destroy
- `app/controllers/api/v1/operations_controller.rb` — generate_legs, generate_routes, geocode
- `app/controllers/api/v1/job_statuses_controller.rb` — show for polling
- `app/controllers/api/v1/stats_controller.rb` — dashboard stats
- `app/controllers/spa_controller.rb` — SPA catch-all (dev redirects to Vite, prod serves built files)
- `app/jobs/generate_legs_job.rb` — wraps BulkLegCreator with progress
- `app/jobs/generate_routes_job.rb` — wraps RouteGenerator with progress
- `app/jobs/geocode_locations_job.rb` — wraps GeocodeLocationJob with progress + mock support
- `config/initializers/cors.rb` — CORS for dev
- `lib/tasks/frontend.rake` — build/install tasks
- `spec/models/job_status_spec.rb` + `spec/requests/api/v1/*.rb` — all API specs

**Modified files:**
- `Gemfile` — added `rack-cors`
- `config/routes.rb` — added `/api/v1/` namespace + SPA catch-all
- `config/environments/development.rb` — `config.active_job.queue_adapter = :async`
- `db/schema.rb` — includes job_statuses table
- `.gitignore` — added `/public/spa/`, e2e artifacts
- `package.json` — added convenience scripts

### Phase 2: Frontend Infrastructure — COMPLETE

Vite + React 19 + TypeScript + Tailwind. Bulletproof React structure. TypeScript compiles cleanly, build succeeds (361KB JS + 15KB CSS).

**Structure (`frontend/src/`):**
- `config/env.ts` — API base URL
- `types/api.ts` — all TypeScript interfaces
- `lib/api-client.ts` — fetch wrapper
- `lib/react-query.ts` — QueryClient config
- `utils/format.ts` — distance/date formatting
- `hooks/use-job-poller.ts` — generic polling hook
- `components/ui/*.tsx` — button, card, badge, spinner, empty-state, modal, progress-bar, input, select
- `components/layouts/*.tsx` — sidebar, app-layout
- `app/index.tsx`, `provider.tsx`, `router.tsx` — app shell

### Phase 3: Core UI Pages — COMPLETE

All feature modules and route pages built.

**Feature API modules (19 files in `frontend/src/features/*/api/`):**
- dashboard: get-stats
- locations: get-locations, get-location, create-location, update-location, delete-location
- races: get-races, get-race, create-race, update-race, delete-race
- routes: get-routes, get-route, update-route, delete-route
- operations: generate-legs, generate-routes, geocode-locations, get-job-status

**Feature components (13 files in `frontend/src/features/*/components/`):**
- dashboard: stats-grid
- locations: locations-list, location-form, location-detail
- races: races-list, race-form, race-detail, location-picker
- routes: routes-list, route-detail, route-map
- operations: job-progress, operation-panel

**Route pages (12 files in `frontend/src/app/routes/`):**
- dashboard.tsx
- locations: locations.tsx, new-location.tsx, location.tsx, edit-location.tsx
- races: races.tsx, new-race.tsx, race.tsx, edit-race.tsx
- routes: race-routes.tsx, route-detail.tsx

### Phase 4: Playwright Test Infrastructure — PARTIALLY COMPLETE

Test files written, dependencies installed, NOT YET RUN.

**Files created:**
- `e2e/package.json` — @playwright/test ^1.49.0
- `e2e/tsconfig.json`
- `e2e/playwright.config.ts` — sequential, 1 worker, dual webServer (Rails 3099 + Vite 5199), MOCK_MAP=true
- `e2e/global-setup.ts` — runs `db:test:prepare` + `e2e:seed`
- `e2e/global-teardown.ts` — runs `e2e:clean`
- `e2e/tests/dashboard.spec.ts` — stats display, sidebar navigation (3 tests)
- `e2e/tests/locations.spec.ts` — list, create, view, edit (4 tests)
- `e2e/tests/races.spec.ts` — list, view detail, create (3 tests)
- `e2e/tests/operations.spec.ts` — generate legs mock, generate routes (2 tests)
- `e2e/tests/routes.spec.ts` — list, detail, rename (3 tests)
- `lib/tasks/e2e.rake` — `e2e:seed` (6 Chicago locations + 1 race) and `e2e:clean`

**Verified working:** Playwright + Chromium installed, e2e:seed and e2e:clean rake tasks run successfully.

---

## What's Left

### Step 1: Run Playwright tests and fix failures

```bash
cd /Users/devin/repo/cartographer/e2e && npx playwright test --reporter=list
```

This starts both servers (Rails test on 3099, Vite on 5199), seeds data, runs 15 tests. Expect some failures on first run — likely issues with:
- Selectors not matching actual rendered UI (text, roles, labels)
- Timing/async waits for operations
- Mock mode behavior
- Form field names not matching

Debug with: `npx playwright test --headed` or `npx playwright test --debug`

### Step 2: Phase 5 — Polish

- Verify `MOCK_MAP=true` works end-to-end (mock geocoding, mock map images, mock leg distances)
- Run `bundle exec rspec` to confirm Rails tests still pass
- Run `cd frontend && npm run build` to confirm frontend builds
- Run Playwright tests green
- Manual smoke test: `rails s` + `cd frontend && npm run dev` → visit localhost:5173

### Step 3: Commit

All changes are uncommitted. Nothing has been pushed. Once everything is green:
```bash
git add -A && git commit -m "Add web UI with React SPA, Rails JSON API, and Playwright tests"
```

---

## Architecture Reference

See the full plan at: `/Users/devin/.claude/plans/cosmic-frolicking-kahan.md`

**API Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/stats` | Dashboard statistics |
| GET/POST | `/api/v1/locations` | List / Create |
| GET/PATCH/DELETE | `/api/v1/locations/:id` | Show / Update / Delete |
| GET/POST | `/api/v1/races` | List / Create |
| GET/PATCH/DELETE | `/api/v1/races/:id` | Show / Update / Delete |
| GET | `/api/v1/races/:race_id/routes` | List routes for race |
| GET/PATCH/DELETE | `/api/v1/races/:race_id/routes/:id` | Show / Update / Delete route |
| GET | `/api/v1/legs` | List legs (optional `?race_id=`) |
| DELETE | `/api/v1/legs/:id` | Delete leg |
| POST | `/api/v1/races/:race_id/generate_legs` | Trigger async leg generation |
| POST | `/api/v1/races/:race_id/generate_routes` | Trigger async route generation |
| POST | `/api/v1/geocode` | Trigger async geocoding |
| GET | `/api/v1/job_statuses/:id` | Poll job progress |
