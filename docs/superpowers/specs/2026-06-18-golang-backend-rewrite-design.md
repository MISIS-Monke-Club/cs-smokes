# Golang Backend Rewrite Design

## Summary

Rewrite the current Django REST Framework backend as a Go backend that is a drop-in replacement for the existing public frontend API. The old Django backend will be fully replaced in `backend/`. The Telegram/user-facing React frontend must keep working without API contract changes, while the database schema may be redesigned for Go and managed through Go migrations.

The migration also adds a separate React admin application, `admin-frontend/`, focused on moderation workflows instead of recreating Django admin as a generic table editor.

## Goals

- Replace the Django/DRF runtime with a Go backend in the existing `backend/` service.
- Preserve public HTTP routes, optional trailing slash behavior, JSON field names, multipart field names, JWT behavior, media URL shapes, and WebSocket comment behavior expected by `tg-frontend`.
- Redesign PostgreSQL schema for Go with explicit migrations, constraints, and indexes.
- Add a separate React/Vite admin app for moderation and content management.
- Keep local Docker startup straightforward through `docker compose up --build`.
- Build contract and integration tests that prove the existing frontend remains compatible.

## Non-Goals

- Do not redesign the public API used by `tg-frontend`.
- Do not keep Django as a parallel runtime service after the rewrite.
- Do not build a broad analytics/audit/backoffice product in the first migration scope.
- Do not mix the admin frontend into the Telegram Web App frontend.

## Chosen Approach

Use a modular Go monolith with a compatibility layer.

Internally, the backend uses Go-oriented package boundaries and a new PostgreSQL schema. Externally, public endpoints continue to emit the current frontend DTOs. This avoids preserving Django-specific database and code structure while still protecting the current frontend from breaking changes.

Rejected alternatives:

- Thin Go clone of DRF handlers: faster initially, but it would carry over unclear Django boundaries and legacy implementation details.
- Full product rewrite: cleaner long term, but too large and risky because it would require frontend, backend, database, and UX changes at the same time.

## Backend Architecture

The Go backend lives in `backend/` and is structured as a modular monolith:

- `cmd/server`: application entrypoint, config loading, logger, database, Redis, router setup.
- `internal/config`: environment parsing and validation.
- `internal/http`: router, middleware, error mapping, CORS, auth guards.
- `internal/auth`: Telegram WebApp auth, password login/register compatibility, JWT issuing and validation.
- `internal/users`: users, admin roles, profile update/read behavior.
- `internal/maps`: map CRUD, filtering, sorting, lineup aggregation for map details.
- `internal/lineups`: lineup CRUD, filters, sort orders, derived `is_favorite` and `request` status fields.
- `internal/grenadeclasses`: grenade class CRUD.
- `internal/properties`: property CRUD and lineup-property linking.
- `internal/favorites`: favorite create/delete/list behavior.
- `internal/pullrequests`: pull requests, comments, moderation status transitions.
- `internal/admin`: admin-only API endpoints for the new React admin app.
- `internal/media`: multipart upload validation, storage, and public URL generation.
- `internal/realtime`: WebSocket comment hub and Redis pub/sub integration.
- `internal/db`: generated `sqlc` queries and database transaction helpers.

HTTP uses `chi`. PostgreSQL access uses `pgx` with `sqlc`. Migrations use `golang-migrate`. Redis uses `go-redis`. WebSocket support uses `nhooyr.io/websocket` with simple hub semantics.

## Public API Compatibility

The public API remains compatible with current frontend calls:

- `POST /api/login/tg/`
- `POST /api/login/`
- `POST /api/register/`
- `GET|POST /api/maps`
- `GET|PUT|PATCH|DELETE /api/maps/{id}`
- `GET|POST /api/lineups`
- `GET|PUT|PATCH|DELETE /api/lineups/{id}`
- `PATCH /api/lineups/{id}/change-grenade-class`
- `GET /api/lineups/view_filters`
- `GET /api/lineups/view_sorts`
- `GET|POST /api/properties`
- `GET|PUT|PATCH|DELETE /api/properties/{id}`
- `GET /api/property-list`
- `POST /api/lineups/{id}/properties`
- `DELETE /api/lineups/{grenade_id}/properties/{property_id}`
- `POST /api/favorites`
- `GET|DELETE /api/favorites/{id}`
- `GET|POST /api/pull_requests`
- `GET|PATCH|DELETE /api/pull_requests/{id}`
- `GET|POST /api/pull_requests/{id}/comments`
- `GET|PATCH|DELETE /api/comments/{id}`
- `PATCH /api/pull_requests/{id}/approve`
- `PATCH /api/pull_requests/{id}/reject`
- `PATCH /api/pull_requests/{id}/cancel`
- `GET /api/health`
- WebSocket comments route compatible with the current frontend path pattern.

Optional trailing slash behavior remains supported for public routes.

Public DTOs preserve the current frontend-facing field names and nested shapes, including:

- `user_id`
- `map_id`
- `grenade_id`
- `grenade_class_id`
- nested `grenade_class`
- nested `creator`
- `property_list`
- `is_favorite`
- `request: { request_id, status }`
- image fields `image_link` and `preview_image_link`
- PR fields `id`, `lineup`, `creator`, `approver`, `status`, `created_at`, `closed_at`
- comment fields `id`, `text`, `creator`, `created_at`

Where public validation errors are visible to the frontend, the Go backend keeps DRF-like object or field-error response shapes used by the current API so existing error handling does not regress.

## Admin API

The admin frontend uses a separate API namespace: `/api/admin/*`. Admin endpoints may use cleaner DTOs than the public compatibility API because the admin frontend is new.

Admin API responsibilities:

- Login using the same JWT auth flow.
- Verify admin roles server-side for every admin route.
- List and filter pull requests by status.
- View pull request details with lineup, author, approver, and comments.
- Approve, reject, and cancel pull requests.
- Create and delete comments where authorized.
- CRUD maps, lineups, grenade classes, properties, and lineup-property links.
- View and update users and admin roles.

Admin errors use a consistent Go-native shape:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Validation failed",
    "fields": {
      "title": "Title is required"
    }
  }
}
```

## Authentication And Authorization

Public API and admin API share JWT authentication. The backend remains the source of truth for authorization.

Telegram login keeps the current Telegram WebApp `init_data` signature validation behavior. The Go implementation must validate the hash according to Telegram's WebApp rules using the bot token from environment configuration.

JWT claims must preserve compatibility with the current frontend and backend assumptions, especially `user_id`. Tokens include admin role booleans for the admin frontend to render navigation and disabled states, but every admin action must still re-check roles on the backend.

Admin roles are represented in the new schema in a way that maps the current concepts:

- superuser
- base admin
- editor

## Database Design

The new PostgreSQL schema is Go-oriented and managed through `golang-migrate`. The implementation plan will define exact DDL for these core tables:

- `users`
- `admin_roles`
- `user_admin_roles`
- `maps`
- `grenade_classes`
- `lineups`
- `properties`
- `lineup_properties`
- `favorites`
- `pull_requests`
- `comments`

The schema includes:

- stable integer primary keys matching public DTO names through mapping code;
- foreign keys for all relationships;
- unique constraints for username, email where present, favorites, and lineup-property links;
- `created_at` and `updated_at` timestamps where useful;
- indexes for lineup filters and sorting, map search, favorites by user, pull requests by status and lineup, and comments by pull request.

The public JSON contract is not tied to database table names. Compatibility is provided by handler/service DTO mapping.

## Data Migration

Production migration includes a path from the old Django-shaped data to the new Go schema. The migration path covers:

- users and auth-relevant fields;
- admin role mappings;
- maps and media paths;
- grenade classes;
- lineups and media paths;
- properties and lineup-property links;
- favorites;
- pull requests and comments.

For local development, seed data may be used early, but it does not replace the production data migration plan.

## Media And Uploads

Multipart upload compatibility is required for current fields:

- maps use `image_link`;
- lineups use `preview_image_link`.

The Go backend stores files in a media directory mounted as a Docker volume. It returns public URLs compatible with current frontend expectations. File validation is explicit for size and content type. Existing media path migration preserves references or copies files into the new media structure.

## Caching And Realtime

Redis remains part of the backend stack.

Caching is added conservatively around read-heavy public list/detail endpoints after correctness is covered. Cache invalidation happens on create/update/delete for maps, lineups, favorites, properties, grenade classes, and pull request status changes where derived fields are affected.

WebSocket comments are implemented in Go with an in-process hub plus Redis pub/sub. This keeps local behavior simple while allowing multiple backend instances later. The payload format sent to the frontend must remain compatible with the current comments array shape.

## Admin Frontend

Create a separate `admin-frontend/` React/Vite app. It is not part of `tg-frontend/`.

The admin app is a moderation workspace with additional content management:

- sidebar navigation;
- top bar with current admin user;
- login screen;
- pull request queue with status filters;
- pull request detail screen showing lineup preview, creator, approver, comments, and actions;
- approve, reject, cancel actions;
- comment list and comment creation/deletion where authorized;
- CRUD screens for maps, lineups, grenade classes, properties, and users/admin roles;
- upload previews for map and lineup images;
- role-based disabled states in the UI.

The first release intentionally excludes broad analytics, advanced audit logs, and operational cache tools.

## Docker And Deployment

The `backend` service remains the backend service in Docker Compose, but its implementation changes from Django to a Go binary. The old Python dependency files and Django runtime scripts are removed or replaced by Go equivalents during implementation.

Compose runs:

- `backend` Go API service;
- PostgreSQL;
- Redis;
- `tg-frontend`;
- `admin-frontend`;
- bot;
- OpenAPI docs served by the Go backend.

External-facing backend port behavior remains compatible with existing local expectations, especially frontend environment variables that target `localhost:3000` or the configured backend URL.

## Documentation

The rewrite updates:

- root README run instructions;
- backend README with Go setup, migrations, tests, and environment variables;
- Docker Compose documentation;
- API docs or OpenAPI generation path;
- admin frontend README.

## Verification

The main acceptance criterion is that existing `tg-frontend` works against the Go backend without public API changes.

Verification must include:

- contract tests for public route paths, status codes, and DTO shapes;
- integration tests using PostgreSQL for auth, maps, lineups, properties, favorites, pull requests, comments, filters, sorting, and derived fields;
- Telegram `init_data` signature tests;
- JWT claim and role tests;
- multipart upload tests for map and lineup images;
- WebSocket comment tests;
- admin API authorization tests;
- admin frontend smoke tests for login, PR queue, PR action, and CRUD navigation;
- Docker Compose smoke test.

## Implementation Phases

The implementation plan breaks this design into phases:

1. Go backend foundation, config, DB, migrations, health, auth primitives.
2. Public API compatibility for core read paths.
3. Public API write paths, uploads, favorites, pull requests, comments, and realtime.
4. Admin API.
5. Separate React admin frontend.
6. Docker, docs, data migration, and end-to-end verification.

Each phase is independently testable and does not require frontend public contract changes.
