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

The public API remains compatible with current `tg-frontend` calls. Public compatibility means route path, method, optional trailing slash handling, authentication behavior, request body field names, multipart field names, response status codes, and DTO field names remain stable unless this spec explicitly introduces a narrower admin-only route under `/api/admin/*`.

All public routes below must accept both slash and no-slash forms where the Django route currently does, for example `/api/maps` and `/api/maps/`. Public routes keep the same JWT requirement as the current DRF implementation: everything below requires `Authorization: Bearer <access_token>` except `POST /api/login/tg/`, `POST /api/login/`, `POST /api/register/`, and `GET /api/health`. Existing public authenticated CRUD workflows used by `tg-frontend` must not silently become admin-only; stricter role checks belong in `/api/admin/*`.

| Route | Methods | Request/query contract | Success responses | Required compatibility coverage |
| --- | --- | --- | --- | --- |
| `/api/login/tg/` | `POST` | JSON `{ "init_data": string }` | `200` with `{ user, access_token, refresh_token }` | Telegram hash validation, missing `init_data` body, invalid hash body, invalid user payload body |
| `/api/login/` | `POST` | JSON `{ "username": string, "password": string }`, where `username` may be username or email | `200` with `{ user, access_token, refresh_token }` | Username login, email login, missing/invalid credentials, Russian field-error bodies currently visible to clients |
| `/api/register/` | `POST` | JSON `{ "username": string, "email": string, "password": string }` | `201` with public user DTO | Duplicate email body, required-field body, password hash created with Go-compatible verifier |
| `/api/users` | `GET`, `POST` | `POST` JSON registration-compatible fields; no current query params | `200` list of user DTOs, `201` user DTO | Same current DRF behavior: any authenticated user may list/create; list order is not contractual; duplicate username/email field errors |
| `/api/users/{id}` | `GET`, `PUT`, `PATCH`, `DELETE` | `id` is public `user_id`; `PUT/PATCH` accept public user fields except password | `200` user DTO, `204` empty body | Same current DRF behavior: any authenticated user may read/update/delete; admin-only user management belongs to `/api/admin/users/*`; `404` body compatibility |
| `/api/maps` | `GET`, `POST` | `GET` query: `is_esports_pool=true|false`, `ordering=quantity|-quantity|by_alphabet|-by_alphabet`, `query=string`; `POST` multipart fields `name`, `link`, `is_esports_pool`, `image_link` | `200` list, `201` map DTO | Filter semantics, multipart upload, cache invalidation after writes, image URL shape |
| `/api/maps/{id}` | `GET`, `PUT`, `PATCH`, `DELETE` | `id` is `map_id`; write bodies use map multipart/form fields | `200` map or map detail DTO, `204` empty body | Detail embeds `map_lineups`; write paths keep public authenticated behavior; `404` body compatibility |
| `/api/grenade-classes` | `GET`, `POST` | `POST` JSON `{ "name": string, "description": string|null, "price": number }` | `200` list, `201` grenade class DTO | Auth required, cache invalidation after writes, validation errors |
| `/api/grenade-classes/{id}` | `GET`, `PUT`, `PATCH`, `DELETE` | `id` is `grenade_class_id`; writes accept `name`, `description`, `price` | `200` grenade class DTO, `204` empty body | Auth required, `404` behavior, partial update behavior |
| `/api/lineups` | `GET`, `POST` | `GET` query: `is_approved=true|false`, `ordering=date_of_creation|-date_of_creation|by_alphabet|-by_alphabet`, `query=string`, `by_user_name=string`; unknown query params, including the current frontend's `creator_id`, must be ignored rather than rejected to match current DRF/django-filter tolerance; `POST` multipart fields `map_id`, `link_to_video`, `user_id`, `title`, `description`, `is_approved`, `views`, `preview_image_link`, `grenade_class_id` | `200` list, `201` lineup DTO | Derived `is_favorite` and `request`, multipart upload, invalid filter bodies, ignored unknown query params, cache invalidation |
| `/api/lineups/{id}` | `GET`, `PUT`, `PATCH`, `DELETE` | `id` is `grenade_id`; writes accept lineup multipart/form fields | `200` lineup DTO, `204` empty body | Detail derived fields, write behavior, `404` body compatibility |
| `/api/lineups/{id}/change-grenade-class` | `PATCH` | JSON `{ "grenade_class_id": number }` | `200` empty/object body compatible with current client tolerance | Missing class id returns `400`, unknown id returns `404`, invalidates lineup caches |
| `/api/lineups/view_filters` | `GET` | No query | `200` `{ "is_approved": ["true", "false"] }` | Exact DTO |
| `/api/lineups/view_sorts` | `GET` | No query | `200` `{ "ordering": ["date_of_creation", "-date_of_creation", "by_alphabet", "-by_alphabet"] }` | Exact DTO |
| `/api/properties` | `GET`, `POST` | `POST` JSON `{ "name": string, "value": string|null }` | `200` list, `201` property DTO | Auth required, field errors |
| `/api/properties/{id}` | `GET`, `PUT`, `PATCH`, `DELETE` | `id` is `property_id`; writes accept `name`, `value` | `200` property DTO, `204` empty body | Auth required, `404` behavior |
| `/api/property-list` | `GET` | Optional `grenade_id` query filters links | `200` list of property-list DTOs | Exact relation DTO shape and query filtering |
| `/api/lineups/{id}/properties` | `POST` | `id` is `grenade_id`; JSON `{ "property_id": number }`, `grenade_id` is path-derived | `201` property-list DTO | Duplicate relation errors, missing property errors |
| `/api/lineups/{grenade_id}/properties/{property_id}` | `DELETE` | Path ids | `204` empty body | Auth required, `404` behavior |
| `/api/favorites` | `POST` | JSON `{ "grenade_id": number }`; `user_id` is always current authenticated user | `201` `{ "user_id": number, "grenade_id": number }` | Duplicate favorite returns DRF-like `non_field_errors`; never trust client-supplied user id |
| `/api/favorites/{id}` | `GET`, `DELETE` | Overloaded legacy behavior: `GET` treats `id` as `user_id`; `DELETE` treats `id` as `grenade_id` for the current user | `200` list of lineup DTOs, `204` empty body | Preserve overload exactly; tests must prevent normalizing this route accidentally |
| `/api/pull_requests` | `GET`, `POST` | `POST` JSON `{ "lineup_id": number }`, creator is current authenticated user | `200` list of PR DTOs, `201` with current create serializer body containing `lineup_id` | Status `OPEN` on create, missing lineup body, unknown lineup body |
| `/api/pull_requests/{id}` | `GET`, `PATCH`, `DELETE` | `PATCH` JSON `{ "status": "OPEN"|"APPROVED"|"REJECTED"|"MERGED"|"CLOSED", "approver_id"?: number }`; `PUT` remains unsupported if exposed | `200` PR DTO/status DTO, `204` empty body, `405` for `PUT` if route receives it | Current creator/admin read/update/delete permissions, unsupported PUT body |
| `/api/pull_requests/{id}/comments` | `GET`, `POST` | `POST` JSON `{ "text": string }`, author is current authenticated user | `200` list of comment DTOs, `201` comment DTO | Order by `created_at`, missing PR returns current `404` body |
| `/api/comments/{id}` | `GET`, `PATCH`, `DELETE` | `PATCH` JSON `{ "text": string }`; `PUT` remains unsupported if exposed | `200` comment DTO, `204` empty body, `405` for `PUT` if route receives it | Same current DRF behavior: any authenticated user may read/update/delete public comments; stricter moderation belongs to WebSocket delete rules and `/api/admin/*` |
| `/api/pull_requests/{id}/approve` | `PATCH` | No body required | `200` `{ "detail": "Pull request approved." }` | Public route remains available to authenticated users with current admin check; unauthorized users get `403` |
| `/api/pull_requests/{id}/reject` | `PATCH` | No body required | `200` `{ "detail": "Pull request rejected." }` | Public route remains available to authenticated users with current admin check; unauthorized users get `403` |
| `/api/pull_requests/{id}/cancel` | `PATCH` | No body required | `200` `{ "detail": "Pull request cancelled." }` | Creator or admin can cancel; sets `status=CLOSED` and `closed_at` |
| `/api/health` | `GET` | No auth | `200` health object | Must work before DB migration smoke and after cutover |

Public DTOs preserve the current frontend-facing field names and nested shapes. Golden contract fixtures must include at least these shapes:

```json
{
  "user": {
    "user_id": 1,
    "username": "player",
    "email": "player@example.com",
    "first_name": null,
    "last_name": null,
    "avatar_url": null,
    "steam_link": null,
    "tg_id": 123456789,
    "is_banned": false
  },
  "map": {
    "map_id": 1,
    "name": "Mirage",
    "link": null,
    "image_link": "http://localhost:3000/media/maps/mirage.png"
  },
  "grenade_class": {
    "grenade_class_id": 1,
    "name": "Smoke",
    "description": "дымовая граната",
    "price": 300
  }
}
```

Lineup DTOs include `grenade_id`, `map_id`, `link_to_video`, `creator`, `created_at`, `title`, `description`, `is_approved`, `is_favorite`, `views`, `preview_image_link`, `grenade_class`, `property_list`, and `request`. `request` is `{ "request_id": number|null, "status": "OPEN"|"APPROVED"|"REJECTED"|"MERGED"|"CLOSED"|"WAITING FOR CREATION" }`; lineups without a pull request must return `request_id: null` and `status: "WAITING FOR CREATION"`. `property_list` entries include `property_id`, `name`, and `value`. `creator` includes `user_id`, `username`, `avatar_url`, `first_name`, and `last_name`.

Pull request DTOs include `id`, nested `lineup`, nested `creator` with `id`, `username`, `first_name`, `last_name`, `avatar_url`, nested nullable `approver` with admin type data, `status`, `created_at`, and `closed_at`. Comment DTOs include `id`, `text`, nested `creator` with `user_id`, `username`, `avatar_url`, `first_name`, `last_name`, `role`, and `created_at`.

Image URL compatibility is part of the contract. Public `image_link` and `preview_image_link` values may be `null`; when non-null they must preserve the current absolute URL behavior for detail/list responses that have request context. Relative `/media/...` URLs are allowed only where the current Django route already emits relative URLs and a golden fixture proves the frontend accepts them. Migration must not replace existing stored media paths with broken host-specific URLs.

Where public validation errors are visible to the frontend, the Go backend keeps DRF-like object or field-error response shapes used by the current API so existing error handling does not regress. Login and registration must preserve body-level examples: `{ "error": "init_data is required" }`, `{ "error": "Invalid hash. Data has been tampered with." }`, duplicate email field errors, and credential field errors on both `username` and `password`.

Golden contract testing is mandatory before replacing Django. A fixture suite must run the same request corpus against the Django backend and the Go backend and diff status code, content type, JSON keys, enum values, nullable fields, path slash behavior, and representative error bodies. Any intentional difference must be listed in this spec before cutover.

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

Admin role checks are server-side and use this permission matrix:

| Capability | superuser | base_admin | editor | Rationale |
| --- | --- | --- | --- | --- |
| Access `/api/admin/*` shell/me endpoints | Yes | Yes | Yes | All named admin roles can use the admin app. |
| Grant or revoke admin roles | Yes | No | No | Role assignment is privilege escalation and is limited to the owner-level role. |
| Delete users | Yes | No | No | User deletion is destructive and can break ownership/history; base admins can moderate without removing accounts. |
| View user list/detail in admin UI | Yes | Yes | No | Moderators need author context; editors do not manage users. |
| Ban/unban or update user moderation flags | Yes | Yes | No | Base admins moderate user behavior; editors manage content only. |
| CRUD maps | Yes | Yes | Yes | Editors are trusted for content taxonomy and lineup support data. |
| CRUD lineups | Yes | Yes | Yes | Editors need content maintenance; public authenticated lineup CRUD remains compatible outside admin. |
| CRUD grenade classes | Yes | Yes | Yes | Editors manage gameplay taxonomy. |
| CRUD properties and lineup-property links | Yes | Yes | Yes | Editors manage lineup metadata. |
| List/filter pull requests | Yes | Yes | Read-only | Editors may inspect context but cannot decide moderation outcomes. |
| Approve or reject pull requests | Yes | Yes | No | Approval changes publication/moderation state and is reserved for moderators. |
| Cancel pull requests in admin UI | Yes | Yes | No | Admin cancellation is moderation; public creator cancel remains compatible. |
| Create comments | Yes | Yes | Yes | Editors can comment to provide content feedback. |
| Delete comments | Yes | Yes | Own comments only | Base admins moderate discussion; editors can retract their own comments. |
| Access operational cache tools | No first-release endpoint | No first-release endpoint | No first-release endpoint | Broad operational tooling is out of first migration scope. |

The public compatibility API is not replaced by this matrix. Public authenticated endpoints keep their current behavior for `tg-frontend`; the stricter role matrix applies to `/api/admin/*` and to public routes that already perform admin checks today, such as PR approve/reject. Negative tests must cover at least: editor cannot approve/reject PRs, editor cannot manage users/roles, base_admin cannot grant roles or delete users, anonymous user cannot access admin routes, authenticated non-admin cannot access admin routes, and client-supplied role claims do not bypass database role checks.

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

Role data in JWT claims is advisory for UI rendering only. The database role mapping is the source of truth for every protected action, including WebSocket comment actions and admin APIs.

## WebSocket Compatibility And Security

WebSocket comments remain available at the current path:

- `/ws/api/pull_requests/{pr_id}/comments/`

The Go backend must preserve the public message payload schema received by the current frontend:

```json
{ "action": "create", "user_id": "1", "message": "hi" }
```

```json
{ "action": "delete", "message_id": 42 }
```

The broadcast payload remains the full comments array serialized like REST comments, ordered by `created_at`.

Production WebSocket authentication is required. Browser WebSocket clients cannot set `Authorization` headers reliably, so the supported production handshake is:

- `GET ws(s)://<host>/ws/api/pull_requests/{pr_id}/comments/?token=<access_token>`
- The backend validates the JWT, checks token expiry, and derives the actor from the token.
- The `user_id` field in `create` messages is accepted only for payload compatibility; it must match the authenticated token user. If it is missing, the authenticated user is used. If it conflicts, the server rejects the message.

The WebSocket `token` query parameter uses the normal access token in the first release; a separate WebSocket-only token is not part of this migration scope. Because the token is carried in the URL, production logging and telemetry must redact it before any sink receives request data:

- nginx access logs must not contain raw `token` query parameter values;
- backend request logs, WebSocket handshake logs, and application error logs must log either no query string or a sanitized query string where `token` is replaced with `[REDACTED]`;
- metrics labels and trace/span attributes must not include raw request URLs, query strings, JWTs, or token-derived values other than non-reversible booleans such as `ws_token_present=true`;
- client diagnostics, error reporting, and console/debug logs must not emit the full WebSocket URL after the token is appended.

Verification must include an automated or scripted production-like log scan that opens a WebSocket with a known sentinel token value, exercises success and failure paths, and proves the raw sentinel value is absent from nginx logs, backend logs, application error logs, metrics labels/traces, and captured client diagnostics.

Legacy unauthenticated WebSocket mode is allowed only in local/dev compatibility mode behind an explicit environment flag such as `WS_ALLOW_UNAUTHENTICATED_DEV=true`. That flag must default to false in all production compose files and deployment examples.

Authorization rules:

- Connection to a nonexistent pull request closes with a policy/invalid-resource close and does not create a room.
- Authenticated users may create comments with their own user identity on pull requests they can read through the public REST API.
- Delete is allowed for the comment author, `base_admin`, and `superuser`; `editor` can delete only own comments.
- Admin API role checks and WebSocket role checks must use the same server-side role source.

Close/error behavior:

- Missing, malformed, expired, or invalid token in production: reject the upgrade or close with a policy violation code; never accept and then process messages anonymously.
- Invalid JSON: keep the connection open, send no broadcast, and optionally send a compact error frame `{ "error": "invalid_json" }`.
- Unknown action: keep the connection open, send no broadcast, and optionally send `{ "error": "unknown_action" }`.
- Unauthorized create/delete: keep the connection open, send no broadcast, and optionally send `{ "error": "forbidden" }`.
- Backend errors after accepting a valid connection must be logged with `pr_id` and authenticated `user_id` but must not leak stack traces to the client.

Frontend-change policy: the only allowed `tg-frontend` change for WebSocket compatibility is a minimal adapter that appends the current access token as the `token` query parameter and derives the WebSocket host from the configured API base URL instead of hardcoding `ws://localhost:3000`. REST routes, REST DTOs, WebSocket message payloads, and rendered comments behavior must remain stable.

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
- explicit preservation of existing production integer IDs for public entities;
- foreign keys for all relationships;
- unique constraints for username, email where present, `tg_id` where non-null, favorites, and lineup-property links;
- `created_at` and `updated_at` timestamps where useful;
- indexes for lineup filters and sorting, map search, favorites by user, pull requests by status and lineup, and comments by pull request.

The public JSON contract is not tied to database table names. Compatibility is provided by handler/service DTO mapping.

## Data Migration

Production migration is a first-class release deliverable, not an implementation afterthought. The migration must be rehearsed against a production backup before cutover and must fail before cutover if compatibility-preserving migration cannot be proven.

ID preservation is mandatory for public entities. The Go schema may be redesigned internally, but these existing integer IDs must be copied exactly into the new database: `user_id`, `map_id`, `grenade_id`, `grenade_class_id`, `property_id`, pull request `id`, comment `id`, and any generated IDs for admin type/admin relation rows that remain public or are referenced by exported fixtures. If an ID cannot be preserved because of sequence conflicts, type limits, duplicate source rows, invalid foreign keys, or schema constraints, the migration fails and cutover is blocked. Silent remapping is not allowed.

Migration stages:

1. Snapshot and freeze plan: take a verified PostgreSQL backup of the Django database and a media volume snapshot. Record source row counts and max IDs for every migrated table.
2. Schema bootstrap: run Go migrations on a new target database. Sequences must be set to at least `max(existing_id)+1` after import for every preserved ID column.
3. Transform and load: copy users, admin role mappings, maps, grenade classes, lineups, properties, lineup-property links, favorites, pull requests, comments, and auth-relevant fields into the target schema.
4. Media migration: preserve existing `maps/` and `lineups/` media references when the referenced source file exists. If files are copied into a new layout, every migrated DB reference must resolve to an existing file and public URL. Missing media is handled as a migration warning only when the source DB already pointed to a missing file; otherwise it is a cutover blocker.
5. Orphan handling: rows with missing required parents are not silently dropped. The migration emits an orphan report by table and id. Required relationship orphans block cutover unless the owner explicitly approves a documented remediation. Optional nullable references, such as missing PR approver, may migrate as `null` only when the Django behavior already permits null.
6. Password compatibility: existing Django password hashes must remain usable. The Go auth layer must verify Django-style encoded password hashes or the migration must rehash only after a successful login with the user's plaintext password. Forced password resets are not part of this rewrite unless approved in a separate product decision.
7. Telegram identity compatibility: `tg_id` remains nullable but is unique when present. Duplicate non-null `tg_id` rows are cutover blockers requiring explicit remediation. Telegram login must continue to find the same user by `tg_id`.
8. Verification: compare source and target row counts, preserved ID sets, foreign-key integrity, unique constraints, auth login samples, media existence, and golden API responses against the target DB.

Cutover plan:

- Run migration rehearsal on a production backup and save the report.
- During production cutover, put the Django app into a write freeze or maintenance window.
- Take final DB and media backups.
- Run the migration to a new Go-owned database.
- Run migration verification and golden API contract checks against the Go backend using the migrated DB.
- Switch nginx/upstream routing to the Go backend only after verification passes, while keeping all public and admin write endpoints disabled, read-only, or maintenance-gated.
- Run post-cutover smoke and golden checks against the Go backend before enabling writes. The write gate may be opened only after these checks pass and the release owner records the pass evidence.
- Keep the Django database, Django media snapshot, and previous image/tag available until post-cutover smoke checks pass.

Rollback plan:

- If migration verification fails before routing switch, keep Django live or restore from the final backup; do not expose the Go backend.
- If post-cutover smoke or golden checks fail while the write gate is still closed, switch nginx/upstream routing back to the Django backend and restore writes to the Django database from the final backup or preserved pre-cutover primary. No Go-side writes should exist in this rollback path because Go write endpoints have not accepted writes.
- After the Go write gate is opened, rollback is no longer allowed to discard accepted writes. A rollback after accepted Go writes requires either a forward-fix that keeps Go as the write authority or an explicit rehearsed reconciliation plan that preserves or replays every accepted write into the restored authority. No accepted write may be declared lost.
- Rollback must be rehearsed at least once in staging, including route switch-back, DB restore, media restore, write-gate behavior, and `tg-frontend` smoke.

For local development, seed data may be used early, but it does not replace the production data migration plan or its rehearsal evidence.

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

Local admin frontend deployment:

- `admin-frontend` is a separate Vite app on local host port `8001`.
- It uses `VITE_ADMIN_API_URL` for the backend API base URL, for example `http://localhost:3000/api`.
- It must not read `tg-frontend` Telegram-specific variables such as `VITE_IN_TG_ENVIRONMENT` or `VITE_TG_INIT_DATA`.
- It may share generated DTO types or client utilities only if that does not couple its build output into `tg-frontend`.

Production admin frontend deployment:

- The first supported production shape is static Vite build output served by nginx under `/admin/` or by a dedicated admin host. Both must be documented.
- If served under `/admin/`, nginx must route `/admin/assets/*` to admin static assets and must fall back `/admin/*` to the admin app `index.html` without intercepting `/api/*`, `/media/*`, or `tg-frontend` routes.
- `VITE_ADMIN_API_URL` is the only supported API base URL source for the admin app. It may point at the same origin `/api` or a full backend origin.
- The Telegram/user-facing frontend continues to use its existing `VITE_BACKEND_URL`; the admin app must not change or require tg frontend environment variable names.

Token storage policy:

- Initial release stores access/refresh tokens in memory plus `sessionStorage`.
- `localStorage` is explicitly disallowed for admin tokens in the first release.
- The README must document the XSS caveat for `sessionStorage` and the reason this is an initial tradeoff rather than a long-term hardening endpoint.
- Logout clears in-memory token state and `sessionStorage`.

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

External-facing backend port behavior remains compatible with existing local expectations, especially frontend environment variables that target `localhost:3000` or the configured backend URL. Local port expectations are:

- Go backend: host `3000`, container API port documented by the Go service.
- `tg-frontend`: host `8000`, unchanged unless existing compose already maps it differently.
- `admin-frontend`: host `8001`.
- PostgreSQL and Redis keep existing compose host ports unless the implementation plan explicitly changes them with README updates.

Production nginx must route:

- `/api/*` to the Go backend;
- `/ws/api/*` to the Go backend with WebSocket upgrade headers;
- `/media/*` to the migrated media volume or Go static/media handler, matching the selected media design;
- `/admin/*` to the admin frontend if path-hosted;
- all existing `tg-frontend` routes without requiring public frontend changes.

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

- golden old-vs-new API diffing for public route paths, optional slashes, status codes, content types, DTO keys, enum values, nullable fields, representative validation errors, and notable error bodies;
- integration tests using PostgreSQL for auth, maps, users, grenade classes, lineups, properties, favorites, pull requests, comments, filters, sorting, and derived fields;
- request-body coverage for JSON and multipart public writes, including map `image_link`, lineup `preview_image_link`, and lineups property linking;
- query semantics coverage for maps, lineups, property-list, favorites overload behavior, and PR/comment ordering;
- Telegram `init_data` signature tests for valid hash, missing hash, invalid hash, invalid user JSON, and existing `tg_id` lookup;
- JWT claim and role tests, including rejecting client-side role claim tampering;
- password hash compatibility tests using representative migrated Django password hashes;
- admin API authorization negative tests for superuser/base_admin/editor/non-admin/anonymous cases from the role matrix;
- WebSocket tests for authenticated handshake, missing token, expired token, malformed token, nonexistent PR, invalid JSON, unknown action, create with mismatched `user_id`, unauthorized delete, and stable broadcast array DTO;
- WebSocket token redaction verification using a sentinel token and automated or scripted scans of nginx logs, backend logs, application error logs, metrics labels/traces, and captured client diagnostics;
- media migration checks that every migrated non-null `image_link` and `preview_image_link` resolves to an existing file and public URL;
- cache invalidation regression checks for create/update/delete of maps, lineups, favorites, properties, grenade classes, PR status changes, and derived lineup `is_favorite`/`request` fields;
- migration rehearsal against a production-like backup, including ID preservation report, orphan report, row-count diff, max sequence validation, media report, and auth sample report;
- rollback rehearsal that proves nginx route switch-back, DB restore, media restore, write-gate behavior, no accepted-write loss, and old backend smoke;
- `tg-frontend` E2E smoke against the Go backend for Telegram login, map list/detail, lineup list/detail, create lineup, favorites add/delete/list, PR create/cancel, comments REST, comments WebSocket, and profile view/edit;
- admin frontend smoke tests for login, PR queue, PR approve/reject/cancel authorization, comments, maps CRUD, lineups CRUD, grenade classes CRUD, properties CRUD, users/roles screens by role, token clearing on logout, and `/admin/` routing refresh;
- Docker Compose smoke test covering local ports `3000`, `8000`, and `8001`.

Representative verification commands must be documented by the implementation work. Expected command categories are:

- Go unit and integration tests, for example `go test ./...` plus DB-backed integration flags or compose profile.
- Contract diff runner against Django and Go.
- Migration dry-run command against a restored backup.
- Frontend checks for both React apps, for example `npm run lint`, `npm run type-check`, `npm run test`, and `npm run build` in each app where scripts exist.
- Playwright or equivalent E2E smoke for `tg-frontend` and admin frontend.

## Implementation Phases

The implementation should be tracked as Beads-sized work units. Do not create these as actual `bd` issues from this spec edit; create them when implementation work starts.

| Work unit | Scope | Depends on | Acceptance evidence |
| --- | --- | --- | --- |
| Backend foundation | Go module in `backend/`, config, logger, router, health, DB/Redis wiring, Docker dev service | None | `GET /api/health` works locally on port `3000`; `go test ./...`; compose starts backend/PostgreSQL/Redis |
| Migration DDL skeleton | `golang-migrate` schema for core tables, preserved public ID columns, constraints, indexes, sequence strategy | Backend foundation | Migrations up/down on empty DB; schema review confirms preserved ID columns and `tg_id` uniqueness |
| Auth compatibility | Telegram login, password login/register, JWT claims, Django password hash verification | Backend foundation, migration DDL skeleton | Auth integration tests; Telegram hash tests; login/register golden error bodies |
| Public users and grenade classes | `/api/users*`, `/api/grenade-classes*` routes with slash behavior, DTOs, errors, cache invalidation | Auth compatibility | Contract diff for routes; integration tests for CRUD and negative cases |
| Public maps read/write | `/api/maps*` routes, filters, ordering, map detail lineups, multipart image upload | Auth compatibility, media storage | Contract diff; DB tests; upload tests; cache invalidation tests |
| Public lineups read/write | `/api/lineups*`, derived `is_favorite` and `request`, filters/sorts, change grenade class | Public maps, public grenade classes, media storage | Contract diff; integration tests for filters, DTOs, derived fields, uploads |
| Public properties and lineup-property links | `/api/properties*`, `/api/property-list`, `/api/lineups/{id}/properties*` | Public lineups | Contract diff; duplicate relation and missing relation tests |
| Public favorites | `/api/favorites` and overloaded `/api/favorites/{id}` behavior | Public lineups | Contract diff proving GET user-id and DELETE grenade-id overload; duplicate favorite errors; derived field invalidation |
| Public pull requests and REST comments | `/api/pull_requests*`, `/api/comments*`, statuses, creator/admin compatibility | Public lineups, auth compatibility | Contract diff; status transition tests; unsupported PUT tests; negative auth tests |
| WebSocket comments | `/ws/api/pull_requests/{pr_id}/comments/`, access-token query auth, token redaction, Redis pub/sub, abuse handling | Public pull requests and REST comments | WS integration tests for handshake, broadcasts, invalid payloads, unauthorized create/delete; sentinel-token log scan proves raw token absence in nginx/backend/app logs, metrics/traces, and client diagnostics |
| Media storage and URL compatibility | Upload validation, media serving, URL generation, migration path support | Backend foundation | Upload tests; absolute/relative URL golden fixtures; media path checks |
| Cache layer and invalidation | Redis caching for selected reads and invalidation after writes affecting derived fields | Public route units | Cache regression tests for maps, lineups, favorites, properties, grenade classes, PR status |
| Admin API roles | `/api/admin/*` auth, role matrix enforcement, admin DTOs and errors | Auth compatibility, public route units as data dependencies | Role matrix tests for superuser/base_admin/editor/non-admin/anonymous |
| Admin frontend scaffold | Separate `admin-frontend/` Vite app, routing, API client, login, token storage | Admin API roles | Local app runs on `8001`; lint/type/build; logout clears session |
| Admin moderation UI | PR queue/detail, approve/reject/cancel, comments with role-based actions | Admin frontend scaffold, Admin API roles | Smoke tests by role; negative disabled-state and backend-forbidden checks |
| Admin content UI | CRUD maps, lineups, grenade classes, properties, users/roles screens by permission | Admin frontend scaffold, Admin API roles | Smoke tests for create/edit/delete and role restrictions |
| Production migration tool | Extract/transform/load from Django DB/media, ID preservation, orphan report, password/media/tg checks | Migration DDL skeleton, public route DTO mapping | Dry-run report on backup; failure on ID remap; sequence validation; media report |
| Golden contract harness | Request corpus runner against Django and Go with diff reporting | Public route units as they land | CI/manual command produces pass/fail diff; intentional diffs require spec update |
| tg-frontend compatibility smoke | Existing frontend E2E against Go backend, including minimal WS token adapter if needed | Public routes, WebSocket comments | Playwright smoke passes without public DTO/route changes |
| Docker/nginx deployment | Compose updates, nginx `/api`, `/ws/api`, `/media`, `/admin` routing, docs | Backend, admin frontend, media | Compose smoke for `3000/8000/8001`; nginx config review; prod-like smoke |
| Cutover and rollback rehearsal | Migration rehearsal, route switch, write freeze/read-only gate, rollback switch, DB/media restore, release checklist | Production migration tool, Docker/nginx deployment, golden contract harness | Staging rehearsal evidence with rollback pass, write gate prevents pre-smoke Go writes, post-write rollback has a rehearsed no-loss reconciliation or forward-fix path, and no unresolved blockers |

Ownership boundaries:

- Backend units own Go code, DB migrations, API contracts, media serving, cache behavior, and backend tests.
- Admin frontend units own only `admin-frontend/`, admin client behavior, and admin UI tests.
- `tg-frontend` changes are limited to the approved WebSocket token/base-URL adapter unless a future spec explicitly expands public frontend scope.
- Migration/release units own scripts, reports, runbooks, and rollback evidence, not product behavior changes.

Each work unit is independently closable only when its acceptance evidence exists. Broad phases may be used for sequencing, but Beads issues should be created at the work-unit level or smaller when implementation begins.
