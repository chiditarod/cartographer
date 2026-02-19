# Architecture Reference

> Read this at the start of every session to avoid codebase exploration.

## Domain Model

```
Race
  ├─ belongs_to :start (Location)
  ├─ belongs_to :finish (Location)
  ├─ has_and_belongs_to_many :locations (pool)
  ├─ has_many :routes
  └─ has_one_attached :logo (Active Storage, PNG/JPEG, max 5 MB)

Route
  ├─ belongs_to :race
  └─ has_many :legs, through: :legs_routes (ordered by legs_routes.order)

Leg
  ├─ belongs_to :start (Location)
  ├─ belongs_to :finish (Location)
  └─ has_many :routes, through: :legs_routes

Location
  └─ has_and_belongs_to_many :races

LegsRoute (join table with PK)
  ├─ belongs_to :leg
  ├─ belongs_to :route
  └─ auto-increments `order` via before_validation

JobStatus (standalone)
  └─ tracks async job progress (pending → running → completed/failed)
```

### Key Fields

| Model | Notable Fields |
|-------|---------------|
| Race | `name`, `num_stops`, `max_teams`, `people_per_team`, `min/max_total_distance`, `min/max_leg_distance`, `start_id`, `finish_id`, `distance_unit` (enum: mi=0, km=1) |
| Route | `race_id`, `complete` (bool, set by before_save), `name`, `rarity_score` (decimal 0-100), `leg_threshold_crossed` |
| Leg | `start_id`, `finish_id`, `distance` (float, meters) |
| Location | `name`, `max_capacity`, `ideal_capacity`, `street_address`, `city`, `state`, `zip`, `lat`, `lng` |
| JobStatus | `job_type`, `status`, `progress`, `total`, `message`, `metadata` (jsonb) |

### Key Callbacks & Behaviors

- **Route `before_save :set_complete_bool`** — sets `complete = true` when valid with all legs; must call `route.save!` after adding legs via association
- **Leg `after_save :create_mirror_leg`** — auto-creates reverse direction leg
- **Leg `before_validation :fetch_distance`** — calls Google Distance Matrix API if distance is blank
- **Route validations** — leg distances within race bounds, locations in race pool, finish only at end, correct leg count (when threshold crossed)

## API Endpoints

All under `/api/v1/`.

| Method | Path | Controller#Action | Notes |
|--------|------|-------------------|-------|
| GET | `/locations` | locations#index | |
| POST | `/locations` | locations#create | |
| GET | `/locations/:id` | locations#show | |
| PATCH | `/locations/:id` | locations#update | |
| DELETE | `/locations/:id` | locations#destroy | |
| GET | `/races` | races#index | |
| POST | `/races` | races#create | FormData when logo present |
| GET | `/races/:id` | races#show | |
| PATCH | `/races/:id` | races#update | Handles `delete_logo` param |
| DELETE | `/races/:id` | races#destroy | |
| POST | `/races/:id/duplicate` | races#duplicate | Copies race + locations + logo blob, prepends "Copy of" |
| GET | `/races/:race_id/routes` | routes#index | |
| GET | `/races/:race_id/routes/:id` | routes#show | Includes `location_sequence` |
| PATCH | `/races/:race_id/routes/:id` | routes#update | |
| DELETE | `/races/:race_id/routes/:id` | routes#destroy | `id=all` deletes all, `id=bulk` + `ids[]` body for bulk |
| GET | `/races/:race_id/routes/export_csv` | routes#export_csv | Optional `?ids=1,2,3` filter |
| GET | `/races/:race_id/routes/:id/export_pdf` | routes#export_pdf | Single route PDF |
| GET | `/races/:race_id/routes/export_pdf` | routes#export_pdf (collection) | `?ids=1,2,3` for batch PDF |
| GET | `/legs` | legs#index | |
| DELETE | `/legs/:id` | legs#destroy | `id=all` deletes all |
| POST | `/geocode` | operations#geocode | |
| POST | `/races/:race_id/generate_legs` | operations#generate_legs | |
| POST | `/races/:race_id/generate_routes` | operations#generate_routes | |
| POST | `/races/:race_id/rank_routes` | operations#rank_routes | |
| GET | `/geocode_search?query=...` | geocode_search#search | Supports MOCK_MAP |
| GET | `/job_statuses/:id` | job_statuses#show | Polled by frontend |
| GET | `/stats` | stats#index | Dashboard stats |
| POST | `/e2e/reset` | e2e#reset | Test env only |
| POST | `/e2e/seed` | e2e#seed | Test env only |

## Backend Services & Jobs

### Workflow (operation order in UI)

```
1. Geocode Locations  →  GeocodeLocationsJob   →  sets lat/lng on locations
2. Generate Legs      →  GenerateLegsJob        →  creates Leg records (Google Distance Matrix)
3. Generate Routes    →  GenerateRoutesJob       →  calls RouteGenerator (recursive DFS)
4. Rank Routes        →  RankRoutesJob           →  computes rarity_score (0-100) per route
```

### Services

| Service | Purpose |
|---------|---------|
| `RouteGenerator` | Recursive DFS that builds all valid complete routes for a race. Tries every valid leg, backtracks on invalid. Can be long-running. |
| `RoutePdfService` | Generates 8.5x11 PDF (Prawn): header (logo + names), map image (Google Static Maps or mock), location table, footer. `.call(route)` for single, `.call_batch(routes)` for multi-page. |

### Jobs

| Job | Inputs | What it does |
|-----|--------|-------------|
| `GeocodeLocationsJob` | job_status_id, location_ids | Geocodes locations via Google API (or random Chicago coords in MOCK_MAP mode) |
| `GenerateLegsJob` | job_status_id, location_ids, test_mode | Creates Leg records between all location pairs via Google Distance Matrix |
| `GenerateRoutesJob` | job_status_id, race_id | Invokes RouteGenerator, reports new route count |
| `RankRoutesJob` | job_status_id, race_id | Scores routes by checkpoint-position rarity; uses `update_column` to skip validations |
| `GeocodeLocationJob` | location_ids | Legacy single-location geocoder (no JobStatus tracking) |
| `BulkLegCreator` | location_ids, test_mode | Legacy leg creator (no JobStatus); superseded by GenerateLegsJob |

### Rarity Algorithm

For each complete route: at each intermediate checkpoint position (not start/finish), score = `1 - (frequency_of_that_location_at_that_position / total_routes)`. Normalize: `(sum / num_stops) * 100` → 0-100 scale.

## Frontend Structure

### App Shell

```
frontend/src/
├── app/
│   ├── index.tsx          # Entry point
│   ├── provider.tsx       # QueryClientProvider wrapper
│   ├── router.tsx         # React Router v7 route tree
│   └── routes/            # Page components (thin wrappers)
│       ├── root.tsx
│       ├── dashboard.tsx
│       ├── help.tsx
│       ├── locations/     # CRUD pages
│       └── races/         # CRUD pages + nested routes
├── components/
│   ├── layouts/
│   │   ├── app-layout.tsx # Main layout wrapper
│   │   └── sidebar.tsx    # Nav: Dashboard, Locations, Races (top) + Help (bottom)
│   ├── ui/                # Shared UI primitives
│   │   ├── badge.tsx      # Accepts optional colorClasses prop
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── empty-state.tsx
│   │   ├── input.tsx
│   │   ├── modal.tsx      # Use instead of window.confirm()
│   │   ├── notification.tsx
│   │   ├── progress-bar.tsx
│   │   ├── select.tsx
│   │   └── spinner.tsx
│   └── logo.tsx
├── features/              # Bulletproof React feature modules
│   ├── dashboard/         # api/ + components/ (stats-grid)
│   ├── help/              # components/ (getting-started)
│   ├── locations/         # api/ (CRUD + geocode-search) + components/ (list, detail, form, place-search)
│   ├── operations/        # api/ (geocode, generate-legs/routes, rank, job-status) + components/ (job-progress, operation-panel)
│   ├── races/             # api/ (CRUD + duplicate) + components/ (list, detail, form, location-picker, selection-frequency-matrix) + utils/
│   └── routes/            # api/ (CRUD + delete-all + delete-selected) + components/ (list, detail, route-map)
├── hooks/
│   └── use-job-poller.ts  # Polls /job_statuses/:id every 1s until complete/failed
├── lib/
│   ├── api-client.ts      # apiFetch<T>() wrapper; base URL /api/v1; auto-detects FormData vs JSON
│   └── react-query.ts     # Config: no refetch on focus, no retry, 1min staleTime
└── utils/
    ├── format.ts          # formatDistance(), formatDate(), formatMutationError()
    └── location.ts        # abbreviateLocation(), buildLocationColorMap() (14 Tailwind color pairs)
```

### Route Tree

| Path | Component | Feature |
|------|-----------|---------|
| `/` | Dashboard | dashboard |
| `/locations` | LocationsList | locations |
| `/locations/new` | LocationForm (create) | locations |
| `/locations/:id` | LocationDetail | locations |
| `/locations/:id/edit` | LocationForm (edit) | locations |
| `/races` | RacesList | races |
| `/races/new` | RaceForm (create) | races |
| `/races/:id` | RaceDetail + OperationPanel + RoutesList | races, operations, routes |
| `/races/:id/edit` | RaceForm (edit) | races |
| `/races/:raceId/routes/:id` | RouteDetail + RouteMap | routes |
| `/help` | GettingStarted | help |

## Data Flow

### Async Job Pattern

```
UI button click → POST /api/v1/races/:id/<operation>
  → Controller creates JobStatus (pending), enqueues job, returns { job_status_id }
  → Frontend useJobPoller starts polling GET /job_statuses/:id every 1s
  → Job runs, calls job_status.tick! for progress updates
  → Job completes → job_status.complete!
  → Frontend sees status=completed, stops polling, invalidates queries
```

### API Client

`apiFetch<T>(path, options)` — prepends `/api/v1`, sets JSON headers (skips Content-Type for FormData), parses errors into `ApiError` with status + errors array. Returns `undefined` for 204.

### React Query

- `staleTime: 60000` (1 minute)
- No refetch on window focus
- No automatic retry
- All API functions return typed promises consumed by `useQuery`/`useMutation`
