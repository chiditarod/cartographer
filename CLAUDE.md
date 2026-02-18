## Project Conventions

- Always use sub-agents and parallelism whenever it is safe to do so to increase throughput and reduce token use.
- Always use Context7 MCP when you need library/API documentation, code generation, setup or configuration steps without user explicitly asking.
- Use dogtag (`../dogtag`) for Playwright integration test patterns ONLY — NOT for UI style, UX, or design inspiration.
- Ensure the React app follows Bulletproof React standard (https://github.com/alan2207/bulletproof-react).
- Put key learnings into CLAUDE.md after every iteration.

## Tech Stack

- **Backend**: Rails 8.0 / Ruby 3.4.8 / PostgreSQL
- **Frontend**: React 19 + TypeScript + Vite 6 + Tailwind CSS 3.4
- **React architecture**: Bulletproof React (feature-based modules, unidirectional flow, no barrel files, kebab-case filenames)
- **Data fetching**: TanStack React Query v5
- **Routing**: React Router v7
- **API**: Namespaced `/api/v1/` with dedicated controllers
- **Async jobs**: Polling via `job_statuses` DB table
- **E2E tests**: Playwright (sequential, 1 worker, dual webServer: Rails 3099 + Vite 5199)

## Key Gotchas

- `legs_routes` join table has NO primary key (`id: false`) — use `LegsRoute.where(route_id: route.id).delete_all` then `route.delete` instead of `route.destroy!`
- Project does NOT include `FactoryBot::Syntax::Methods` — always use `FactoryBot.create(:factory)`, not bare `create`
- Race model uses enum for `distance_unit` (`mi: 0, km: 1`)
- Keep `root 'home#index'` for existing specs; SPA catch-all only handles unmatched paths
- `RouteGenerator` is recursive and can be long-running
- `MOCK_MAP=true` env var enables mock mode for development without Google API key

## Commands

- `bundle exec rspec` — Run all RSpec tests (151 tests, all passing, 85% coverage)
- `cd frontend && npm run build` — Build frontend (outputs to `../public/spa/`)
- `cd frontend && npm run dev` — Start Vite dev server
- `cd e2e && npx playwright test --reporter=list` — Run Playwright E2E tests
- `RAILS_ENV=test bundle exec rake e2e:seed` — Seed E2E test data
- `RAILS_ENV=test bundle exec rake e2e:clean` — Clean E2E test data
