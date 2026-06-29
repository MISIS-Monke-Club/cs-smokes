# Grace Memory: cs-smokes

Last updated: 2026-06-29

## Project Purpose

`cs-smokes` is a CS2 lineup platform for viewing and managing grenade throws on popular Valve/Faceit maps. The product is available through a Telegram Web App and a normal web frontend. Core user workflows include Telegram login, browsing maps and lineups, filtering/sorting grenade lineups, adding lineups, marking favorites, and creating moderation pull requests for lineups.

## Repository Shape

- `backend/`: Go backend replacing the legacy Django REST runtime. Runtime code lives under `cmd/`, `internal/`, `migrations/`, and `tools/`; Python files under `backend/` are limited to tests.
- `tg-frontend/`: React 18 + Vite + TypeScript frontend using Feature-Sliced Design, Redux Toolkit, React Query, zod DTO validation, SCSS modules, Storybook, Vitest, Playwright tooling, and Telegram Web Apps integration.
- `bot/`: Go Telegram polling bot that sends a Web App button pointing at `WEB_APP_URL`.
- `info-service/`: Swagger UI container reading `info-service/swagger.yaml`.
- `nginx/`: production nginx config mounted by `docker-compose.prod.yaml`.
- `.codex/skills/`: project-local Codex skills installed from the archive.
- `.beads/`: Beads issue-tracker state, initialized locally with embedded Dolt.
- `.grace/memory.md`: repository memory mirror for Grace.

## Agent And Workflow Rules

- Read `AGENTS.md` first.
- Start every session with `superpowers:using-superpowers`, then invoke relevant Superpowers skills before acting.
- Run `bd prime` for Beads context. Use `bd` for task tracking, not ad hoc TODO files.
- Use `.grace/memory.md` as the Grace memory mirror unless a real Grace CLI/MCP/plugin is available; if it is available, update Grace first and keep this file in sync.
- Installed local skills:
  - `spec-reviewer`: strict review of specs, requirements, design docs, implementation plans, and Superpowers plans.
  - `spec-review-fixer`: targeted application of spec-review findings without inventing business logic.
- Never run `bd init --force`. If Beads is missing or broken, diagnose first and use safe init/bootstrap/recovery.

## Runtime And Deployment

- Local compose command from README: `docker compose up -d --build`.
- Dev compose services:
  - `tg-frontend`: Vite dev server, host port `8000`, container port `5173`.
  - `backend`: Go HTTP server, host port `3000`, container port `8000`.
  - `db`: PostgreSQL 15 Alpine, host port `5433`, container port `5432`.
  - `redis`: Redis Alpine, host port `6379`, password from `REDIS_PASS`.
  - `info-service`: Swagger UI, host port `9999`, container port `8080`.
  - `bot`: Go Telegram polling bot.
- Production compose builds the Go `backend` from `backend/dockerfile.prod`, builds frontend/nginx from `tg-frontend/dockerfile.prod`, exposes nginx on `80` and `443`, and mounts Let's Encrypt certs from `/etc/letsencrypt/ssl`.
- Required env vars are documented in `.env.example`; do not commit real `.env` or secrets.

## Backend Architecture

- Runtime entrypoint is `backend/cmd/server`, with HTTP routing in `backend/internal/platform/httpserver`.
- JWT auth is implemented in Go and uses the legacy-compatible `user_id` claim.
- Most API routes require bearer auth; login/register, Telegram auth, health, schema, docs, and media serving are exceptions.
- API is mounted under `/api/`; schema is `/api/schema`, docs are `/api/docs`, health check is `/api/health`.
- WebSocket comments are served by the Go realtime hub at `/ws/api/pull_requests/{id}/comments/`.
- Redis is used as a best-effort cache for public maps/lineups reads.
- Media files are served from `MEDIA_ROOT` with public URLs based on `PUBLIC_MEDIA_URL`.

## Domain Entities

- `User`: username, email, first/last name, avatar URL, Steam link, Telegram id, banned flag. Staff/superuser behavior is derived from related `Admins` rows.
- `AdminType`: flags `is_superuser`, `is_base_admin`, `is_editor`.
- `Admins`: joins `User` to `AdminType`; unique by `(user_id, admin_type_id)`.
- `Map`: name, external link, `is_esports_pool`, uploaded image.
- `GrenadeClass`: grenade type name, description, and price. Seed data includes Molotov, HE Grenade, Flashbang, Smoke.
- `Lineup`: primary key `grenade_id`; belongs to `Map`, `User`, and `GrenadeClass`; has video link, title, description, approval flag, view count, preview image, and creation timestamp.
- `Property`: reusable name/value metadata such as tickrate, jumpthrow, one-way.
- `PropertyList`: joins `Property` to `Lineup`; unique by `(property_id, grenade_id)`.
- `Favorites`: joins `User` to `Lineup`; unique by `(user_id, grenade_id)`.
- `PullRequest`: moderation request for a lineup. Status values: `OPEN`, `APPROVED`, `REJECTED`, `MERGED`, `CLOSED`.
- `Comment`: comment on a pull request, authored by a user.

## Backend Business Logic

- Telegram auth endpoint `/api/login/tg/` validates Telegram WebApp `init_data` with HMAC using bot `TOKEN`. It creates or retrieves a user by `tg_id`, then returns `access_token`, `refresh_token`, and serialized user data.
- Web login `/api/login/` accepts username or email in the `username` field and returns JWT tokens plus user data.
- Registration `/api/register/` creates a user with username, email, and password after checking email uniqueness.
- Lineup list/detail responses are enriched with:
  - `is_favorite`, based on the current authenticated user.
  - `request`, derived from any `PullRequest` for the lineup or defaulting to `{ request_id: null, status: "WAITING FOR CREATION" }`.
- Lineup list filtering supports `is_approved`, `query` over title/description, `by_user_name`, and ordering by `date_of_creation` or `by_alphabet` with optional descending `-`.
- Maps support filtering by `is_esports_pool`, search by `query` over name, and ordering by lineup `quantity` or `by_alphabet`.
- Map detail embeds its related lineups and enriches them with favorite/request status.
- Favorites are per user and per lineup. Add uses `/api/favorites/`; delete/get uses `/api/favorites/<pk>/`, where `pk` is used as grenade id for delete and user id for list retrieval.
- Pull request creation accepts `lineup_id` and sets creator from `request.user` with status `OPEN`.
- Pull request status updates through generic PATCH require admin privileges. Dedicated endpoints `/approve/` and `/reject/` also require `request.user.is_staff`; `/cancel/` allows the creator or staff and sets status `CLOSED` plus `closed_at`.
- Pull request comments are available through REST and WebSocket. WebSocket path is `/ws/api/pull_requests/<pr_id>/comments/`; messages support `{"action":"create","user_id":"1","message":"hi"}` and `{"action":"delete","message_id":42}`.
- The preserved legacy Django runtime is not part of the default backend service. It is available only through `backend/dockerfile.legacy-django` and `docker-compose.legacy-django.yaml` for contract baseline capture.

## Frontend Architecture

- Frontend follows Feature-Sliced Design-ish layers: `app`, `pages`, `widgets`, `features`, `entities`, `shared`.
- Router paths include `/`, `/grenades`, `/grenades/:grenadeId`, `/grenades/create`, `/requests/:requestId`, `/maps`, `/maps/:mapId`, `/maps/:mapId/grenades`, `/profile`, `/guest/profile/:userId`, `/profile/edit`, `/favorites`.
- Root router loader clears `localStorage`, initializes auth slice and Axios interceptors, then dispatches `loginThunk` when there is no access token.
- Axios instance base URL is `VITE_BACKEND_URL`.
- Login uses `VITE_IN_TG_ENVIRONMENT`: if `true`, it reads `Telegram.WebApp.initData`; otherwise it uses `VITE_TG_INIT_DATA` or `"no-init-data"`.
- Axios request interceptor adds `Authorization: Bearer <accessToken>` to non-login requests.
- DTOs are validated with zod before being transformed into frontend models.
- React Query cache keys are defined on entity API modules, for example `["grenade"]`, `["map"]`, `["grenade-class"]`, `["pull_request"]`, `["favorites"]`.

## Frontend Domain Notes

- `GrenadeModel` expects backend lineup DTO with nested `grenade_class`, `property_list`, `creator`, `is_favorite`, and `request`.
- `MapPageModel` extends map data with `mapLineups`.
- `PullRequest` frontend status union includes backend statuses plus `WAITING FOR CREATION` because lineups expose that default request state.
- Creating a lineup posts converted form data to `/lineups/`, then invalidates grenade and map detail queries.
- Pull request creation posts `{ lineup_id: grenadeId }` to `/pull_requests`, then invalidates pull request and grenade query caches.

## Commands And Quality Gates

- Backend dev entrypoint: `backend/run-server.sh`.
- Backend prod entrypoint: `backend/run-server.prod.sh`.
- Backend checks: `cd backend && go test ./...`, plus `python3 -m unittest discover -s backend/tests` for repository-level guard tests.
- Frontend scripts:
  - `npm run dev`
  - `npm run host`
  - `npm run build`
  - `npm run lint`
  - `npm run lint:auto-fix`
  - `npm run lint:format`
  - `npm run test`
  - `npm run type-check`
  - `npm run storybook`
  - `npm run build-storybook`
- Frontend dev entrypoint `tg-frontend/run-server.sh` runs `npm install`, then `npm run host`.

## Important Gotchas

- Console output for existing Russian text may appear mojibaked in PowerShell; preserve file encodings and avoid unnecessary rewrites of Russian prose.
- Cache invalidation uses both hashed list keys such as `grenade_list_*`/`map_list_*` and some singular keys such as `grenade_list`/`maps_list`; check exact cache keys before changing cache behavior.
- The backend has both REST comments and WebSocket comments for pull requests. Keep behavior aligned if changing comments.
- Permission helpers are custom Go logic backed by `Admins`/`AdminType` rows.
- The Go migration tool under `backend/tools/migrate-django` reads legacy Django PostgreSQL/media sources and validates ID preservation before cutover.
- `Lineup.grenade_id` is the lineup primary key and is commonly called "grenade" in frontend/API code.
