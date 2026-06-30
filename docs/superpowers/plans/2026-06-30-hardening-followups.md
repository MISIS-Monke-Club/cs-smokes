# Hardening Followups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the highest-risk compatibility bugs and reduce maintenance bottlenecks found in the `ai/develop` audit.

**Architecture:** Make behavior-preserving changes in small, verified slices. First fix backend PATCH field-presence semantics and frontend DTO nullable contracts, then split admin UI modules without changing rendered behavior, then split persistence code and expand OpenAPI coverage while preserving existing public API contracts.

**Tech Stack:** Go 1.25.5, chi, pgx/sqlc, React 18, Vite, TypeScript, Vitest, zod, Beads.

---

## File Structure

- `backend/internal/maps/dto.go`: represent PATCH field presence for `is_esports_pool` separately from boolean value.
- `backend/internal/lineups/dto.go`: represent PATCH field presence for `is_approved` and `views` separately from zero values.
- `backend/internal/grenadeclasses/dto.go`: represent PATCH field presence for `price`.
- `backend/internal/maps/handlers.go`, `backend/internal/lineups/handlers.go`: decode multipart form fields with field-presence helpers.
- `backend/internal/grenadeclasses/handlers.go`: decode JSON through a raw pointer input type for PATCH.
- `backend/internal/platform/postgresrepo/*.go`: split `store.go` by domain after behavior fixes are green.
- `backend/internal/db/query.sql`: add filtered list queries only after preserving current contract tests.
- `backend/internal/openapi/openapi.go`: replace the placeholder response with a typed schema document.
- `backend/tests/maps/handlers_test.go`, `backend/tests/lineups/handlers_test.go`, `backend/tests/grenadeclasses/handlers_test.go`: add handler-level regression tests for PATCH preserving omitted fields.
- `backend/tests/postgresrepo/repositories_test.go`: add repository-level field-presence regression tests where practical.
- `backend/tests/openapi/handlers_test.go`: assert representative schema details, nullable fields, admin routes, and websocket route.
- `tg-frontend/src/entities/grenade/model/domain.ts`: make nullable DTO fields match backend.
- `tg-frontend/src/entities/grenade-class/model/domain.ts`: make grenade class description nullable.
- `tg-frontend/src/entities/grenade/lib/dto-transformer.ts`, `tg-frontend/src/entities/grenade-class/dto-transformer.ts`: keep frontend model nullable where backend is nullable.
- `tg-frontend/src/entities/*/*.test.ts`: add DTO parsing/transform tests for nullable backend payloads.
- `admin-frontend/src/App.tsx`: reduce to shell composition and shared action wiring.
- `admin-frontend/src/features/moderation/*`: pull request table/detail/comments UI.
- `admin-frontend/src/features/users/*`: users and role checkboxes UI.
- `admin-frontend/src/features/content/*`: lineup and catalog UI.
- `admin-frontend/src/shared/ui/*`: reusable metric/table/form/action components.
- `admin-frontend/src/useAdminData.ts`: data loading, refresh, auth failure, and selected record state.

## Task 1: Backend PATCH Field Presence

**Files:**
- Modify: `backend/internal/maps/dto.go`
- Modify: `backend/internal/maps/handlers.go`
- Modify: `backend/internal/lineups/dto.go`
- Modify: `backend/internal/lineups/handlers.go`
- Modify: `backend/internal/grenadeclasses/dto.go`
- Modify: `backend/internal/grenadeclasses/handlers.go`
- Modify: `backend/internal/platform/postgresrepo/store.go`
- Modify: `backend/tests/maps/handlers_test.go`
- Modify: `backend/tests/lineups/handlers_test.go`
- Modify: `backend/tests/grenadeclasses/handlers_test.go`

- [ ] **Step 1: Write failing handler regression tests**

Add tests proving `PATCH /api/maps/{id}` without `is_esports_pool` preserves true, `PATCH /api/lineups/{id}` without `is_approved` and `views` preserves true/positive views, and `PATCH /api/grenade-classes/{id}` without `price` preserves the existing price. The fake repositories should emulate merge semantics and assert field presence is visible to repository code.

- [ ] **Step 2: Verify red**

Run:

```bash
cd backend
go test ./tests/maps ./tests/lineups ./tests/grenadeclasses
```

Expected: FAIL because omitted fields are indistinguishable from zero values.

- [ ] **Step 3: Add field-presence types**

Use pointers for fields where zero is a valid update value:

```go
type Input struct {
    Name          string
    Link          *string
    IsEsportsPool *bool
    ImagePath     *string
}
```

```go
type Input struct {
    MapID            int
    LinkToVideo      *string
    UserID           int
    Title            string
    Description      *string
    IsApproved       *bool
    Views            *int
    PreviewImagePath *string
    GrenadeClassID   int
}
```

```go
type Input struct {
    Name        string  `json:"name"`
    Description *string `json:"description"`
    Price       *int    `json:"price"`
}
```

- [ ] **Step 4: Decode only present fields**

For multipart handlers, set pointers only when `r.MultipartForm.Value` contains the key:

```go
if _, ok := r.MultipartForm.Value["is_esports_pool"]; ok {
    value := r.FormValue("is_esports_pool") == "true"
    input.IsEsportsPool = &value
}
```

Use the same pattern for `is_approved` and `views`.

- [ ] **Step 5: Preserve current values in repository PATCH**

In merge branches, copy existing values when pointers are nil. For non-merge create/replace paths, validate required fields and dereference with safe defaults.

- [ ] **Step 6: Verify green**

Run:

```bash
cd backend
go test ./tests/maps ./tests/lineups ./tests/grenadeclasses ./tests/cache ./tests/httpserver ./tests/postgresrepo
go test ./...
```

Expected: all packages pass.

## Task 2: Frontend Nullable DTO Contracts

**Files:**
- Modify: `tg-frontend/src/entities/grenade/model/domain.ts`
- Modify: `tg-frontend/src/entities/grenade/lib/dto-transformer.ts`
- Create: `tg-frontend/src/entities/grenade/lib/dto-transformer.test.ts`
- Modify: `tg-frontend/src/entities/grenade-class/model/domain.ts`
- Modify: `tg-frontend/src/entities/grenade-class/dto-transformer.ts`
- Create: `tg-frontend/src/entities/grenade-class/dto-transformer.test.ts`

- [ ] **Step 1: Write failing nullable DTO tests**

Add Vitest tests where backend-shaped DTOs contain:

```ts
grenade_class: { description: null }
property_list: [{ property_id: 1, name: "tickrate", value: null }]
```

and grenade class DTO has `description: null`.

- [ ] **Step 2: Verify red**

Run:

```bash
cd tg-frontend
npm run test -- --run src/entities/grenade/lib/dto-transformer.test.ts src/entities/grenade-class/dto-transformer.test.ts
```

Expected: FAIL because the zod schemas reject nullable values.

- [ ] **Step 3: Update schemas and model types**

Use `z.string().nullable()` for backend-nullable fields and propagate `string | null` into frontend models.

- [ ] **Step 4: Verify green**

Run:

```bash
cd tg-frontend
npm run test -- --run src/entities/grenade/lib/dto-transformer.test.ts src/entities/grenade-class/dto-transformer.test.ts
npm run type-check
```

Expected: tests and type-check pass.

## Task 3: Admin Frontend Decomposition

**Files:**
- Modify: `admin-frontend/src/App.tsx`
- Create: `admin-frontend/src/useAdminData.ts`
- Create: `admin-frontend/src/shared/ui.tsx`
- Create: `admin-frontend/src/features/moderation.tsx`
- Create: `admin-frontend/src/features/users.tsx`
- Create: `admin-frontend/src/features/content.tsx`
- Modify: existing admin tests if imports move.

- [ ] **Step 1: Capture baseline checks**

Run:

```bash
cd admin-frontend
npm run test
npm run type-check
```

Expected: both pass before refactor.

- [ ] **Step 2: Extract reusable UI without behavior changes**

Move `Metric`, `SimpleTable`, `RowActions`, `FormHeading`, and `submitForm` into `shared/ui.tsx`. Keep class names and props stable.

- [ ] **Step 3: Extract moderation UI**

Move `PullRequestTable` and `DetailPanel` into `features/moderation.tsx`. Keep callback props explicit and leave API calls in `App.tsx` or hook.

- [ ] **Step 4: Extract users UI**

Move `UsersPanel` and `RoleCheckboxes` into `features/users.tsx`.

- [ ] **Step 5: Extract content UI**

Move `LineupsPanel`, `LineupDetail`, `LineupForm`, `CatalogPanel`, and helpers into `features/content.tsx`.

- [ ] **Step 6: Extract admin data hook**

Move token, `me`, loaded lists, selected ids, detail loading, `resetSession`, and `loadAdminData` into `useAdminData.ts`. `App.tsx` should compose shell sections and action handlers.

- [ ] **Step 7: Verify after each extraction**

Run after each extraction:

```bash
cd admin-frontend
npm run type-check
```

Expected: pass after every extraction. Run `npm run test` after the full split.

## Task 4: Postgres Repository Split and Query Tightening

**Files:**
- Modify: `backend/internal/platform/postgresrepo/store.go`
- Create: `backend/internal/platform/postgresrepo/users.go`
- Create: `backend/internal/platform/postgresrepo/auth.go`
- Create: `backend/internal/platform/postgresrepo/roles.go`
- Create: `backend/internal/platform/postgresrepo/maps.go`
- Create: `backend/internal/platform/postgresrepo/lineups.go`
- Create: `backend/internal/platform/postgresrepo/properties.go`
- Create: `backend/internal/platform/postgresrepo/favorites.go`
- Create: `backend/internal/platform/postgresrepo/pullrequests.go`
- Create: `backend/internal/platform/postgresrepo/realtime.go`
- Create: `backend/internal/platform/postgresrepo/convert.go`
- Modify: `backend/internal/db/query.sql`
- Regenerate: `backend/internal/db/generated/query.sql.go`

- [ ] **Step 1: Move code mechanically by domain**

Move existing methods into focused files without changing function bodies. Keep package `postgresrepo`; no import path changes.

- [ ] **Step 2: Verify mechanical split**

Run:

```bash
cd backend
gofmt -w internal/platform/postgresrepo
go test ./tests/postgresrepo ./tests/httpserver ./...
```

Expected: all pass.

- [ ] **Step 3: Add SQL-filtered list queries**

Add filtered `ListMapsFiltered` and `ListLineupsFiltered` sqlc queries only for filters already supported by public handlers. Keep legacy query names if needed for tests.

- [ ] **Step 4: Regenerate sqlc code**

Run:

```bash
cd backend
sqlc generate
```

Expected: generated code compiles. If `sqlc` is unavailable, stop and report that this subtask needs the generator.

- [ ] **Step 5: Switch repository lists to SQL filters**

Use generated filtered queries for map/lineup list endpoints. Keep existing DTO enrichment and ordering semantics covered by tests.

- [ ] **Step 6: Verify**

Run:

```bash
cd backend
go test ./...
```

Expected: all pass.

## Task 5: OpenAPI Contract Schema

**Files:**
- Modify: `backend/internal/openapi/openapi.go`
- Modify: `backend/tests/openapi/handlers_test.go`

- [ ] **Step 1: Write failing schema tests**

Assert `/api/schema` contains representative public/admin/websocket routes, request body metadata, response schemas, nullable DTO fields, enum statuses, and trailing slash policy where represented.

- [ ] **Step 2: Verify red**

Run:

```bash
cd backend
go test ./tests/openapi
```

Expected: FAIL because the current schema is a placeholder.

- [ ] **Step 3: Replace schema body with typed OpenAPI document**

Build a static Go map through small helper functions for paths, operations, schemas, enums, nullable fields, and security. Keep `Docs` route unchanged except for referencing `/api/schema`.

- [ ] **Step 4: Verify**

Run:

```bash
cd backend
go test ./tests/openapi
go test ./...
```

Expected: all pass.

## Task 6: Final Review and Quality Gates

**Files:**
- All files touched above.

- [ ] **Step 1: Run backend gates**

```bash
cd backend
go test ./...
python3 -m unittest discover -s tests
```

- [ ] **Step 2: Run frontend gates**

```bash
cd tg-frontend
npm run test
npm run type-check
cd ../admin-frontend
npm run test
npm run type-check
```

- [ ] **Step 3: Review diff for scope**

```bash
git diff --stat
git diff --check
```

- [ ] **Step 4: Request code review**

Use `superpowers:requesting-code-review` after each natural checkpoint and at the end. Fix Critical/Important findings before proceeding.

## Self-Review

- Spec coverage: all five requested workstreams are represented by Tasks 1-5, with final verification in Task 6.
- Placeholder scan: no `TBD`/`TODO` placeholders are present; each task names concrete files and commands.
- Type consistency: field-presence changes use pointer fields in Go inputs and nullable fields in TypeScript DTO models.
