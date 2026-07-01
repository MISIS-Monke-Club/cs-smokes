# Interactive Lineup Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the reviewed interactive 2D CS2 radar map feature for browsing, creating, and moderating lineups by normalized map spots.

**Architecture:** Ship backend contract and nullable schema first, then admin moderation tools, then tg-frontend browsing and creation flows. The backend owns canonical spot normalization, marker filtering, public/admin visibility, radar asset serving, and moderation blocking; frontends consume additive DTO fields and submit normalized coordinates. Existing list-based lineup and map flows must keep working after every task.

**Tech Stack:** Go 1.25, chi, pgx/sqlc, PostgreSQL migrations, React 18, Vite, TypeScript, React Query, zod, Vitest, SCSS modules, admin Vite app.

---

## Source Spec

- `docs/superpowers/specs/2026-06-30-interactive-lineup-map-design.md`
- Beads planning issue: `cs-smokes-dey`

## File Structure

Backend files:

- Create `backend/migrations/000002_interactive_lineup_map.up.sql`: add radar fields, `map_spots`, lineup spatial fields, indexes, and active-pool seed.
- Create `backend/migrations/000002_interactive_lineup_map.down.sql`: reverse task 1 schema changes in dependency order.
- Create `backend/assets/radars/.gitkeep`: preserve radar bundle directory.
- Add PNG files under `backend/assets/radars/`: `de_ancient.png`, `de_anubis.png`, `de_cache.png`, `de_dust2.png`, `de_inferno.png`, `de_mirage.png`, `de_nuke.png`, `de_overpass.png`.
- Modify `backend/internal/db/query.sql`: add radar columns, spot queries, spatial lineup queries, public spot aggregation plus representative lineup queries, unplaced queue, and `grenade_class_id` filter.
- Modify generated sqlc files under `backend/internal/db/generated/` after query changes.
- Modify `backend/internal/maps/dto.go`, `backend/internal/maps/repository.go`, `backend/internal/maps/handlers.go`, `backend/internal/maps/routes.go`: radar DTO fields, radar upload fields, radar serving, spots route registration.
- Create `backend/internal/mapspots/dto.go`, `backend/internal/mapspots/repository.go`, `backend/internal/mapspots/handlers.go`, `backend/internal/mapspots/routes.go`: canonical spot domain and admin/public handler DTOs.
- Modify `backend/internal/lineups/dto.go`, `backend/internal/lineups/filters.go`, `backend/internal/lineups/handlers.go`, `backend/internal/lineups/repository.go`: spatial fields, multipart parsing, `grenade_class_id` filtering, DTO output.
- Modify `backend/internal/platform/postgresrepo/maps.go`, `backend/internal/platform/postgresrepo/lineups.go`, `backend/internal/platform/postgresrepo/store.go`, `backend/internal/platform/postgresrepo/pullrequests.go`: repository implementation and moderation blocking.
- Modify `backend/internal/platform/cache/maps.go`, `backend/internal/platform/cache/lineups.go`, `backend/internal/platform/cache/repositories.go`: pass-through new repository methods and invalidate caches after spatial writes.
- Modify `backend/internal/platform/httpserver/server.go`: wire `MapSpots` repository, admin routes, public spots route, and radar static route.
- Modify `backend/internal/openapi/openapi.go`: additive DTO fields and new endpoint schema.
- Add/update backend tests under `backend/tests/db`, `backend/tests/maps`, `backend/tests/lineups`, `backend/tests/postgresrepo`, `backend/tests/admin`, `backend/tests/httpserver`, and `backend/tests/openapi`.

tg-frontend files:

- Modify `tg-frontend/src/entities/map/model/domain.ts`, `tg-frontend/src/entities/map/lib/dto-transformer.ts`, `tg-frontend/src/entities/map/api/client.ts`: radar DTO/model fields and spots API.
- Modify `tg-frontend/src/entities/grenade/model/domain.ts`, `tg-frontend/src/entities/grenade/lib/dto-transformer.ts`: spot and aim DTO/model fields.
- Create `tg-frontend/src/entities/map-spot/model/domain.ts`, `tg-frontend/src/entities/map-spot/lib/coordinates.ts`, `tg-frontend/src/entities/map-spot/api/client.ts`, `tg-frontend/src/entities/map-spot/index.ts`: reusable spot contracts and coordinate math.
- Create `tg-frontend/src/features/map/radar-picker/ui/radar-picker.tsx`, `tg-frontend/src/features/map/radar-picker/ui/radar-picker.module.scss`, `tg-frontend/src/features/map/radar-picker/index.ts`: quadrant zoom and point placement control.
- Create `tg-frontend/src/widgets/interactive-map/ui/interactive-map.tsx`, `tg-frontend/src/widgets/interactive-map/ui/interactive-map.module.scss`, `tg-frontend/src/widgets/interactive-map/index.ts`: radar browsing widget with bottom sheet.
- Modify `tg-frontend/src/widgets/map-overview/ui/map-overview.tsx`: replace list-only map view with interactive map plus existing list fallback.
- Modify `tg-frontend/src/features/grenade/add-grenade/model.ts`, `tg-frontend/src/features/grenade/add-grenade/ui/add-lineup-form.tsx`, `tg-frontend/src/features/grenade/add-grenade/api.ts`: require and submit throw, aim, target fields.
- Modify `tg-frontend/package.json` and lockfile when component tests need `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, and `jsdom`.
- Add/update tg-frontend tests for DTOs, coordinate math, picker behavior, bottom sheet grouping, and FormData output.

admin-frontend files:

- Modify `admin-frontend/src/api.ts`: types and clients for radar fields, map spots, unplaced queue, spatial lineup fields.
- Modify `admin-frontend/src/catalog.ts`, `admin-frontend/src/lineups.ts`: form state and conversion for radar/spatial fields.
- Modify `admin-frontend/src/hooks/useAdminData.ts`: load spots and unplaced queue with existing content data.
- Modify `admin-frontend/src/features/content-catalog/types.ts`, `admin-frontend/src/features/content-catalog/ContentPanels.tsx`: maps radar controls, map spots section, unplaced queue.
- Modify `admin-frontend/src/shared/ui.tsx` and `admin-frontend/src/styles.css`: compact radar preview and spot action controls.
- Modify `admin-frontend/package.json` and lockfile when component tests need `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, and `jsdom`.
- Add/update admin-frontend tests in `admin-frontend/src/api.test.ts`, `admin-frontend/src/catalog.test.ts`, and component tests for spot actions.

## Implementation Rules

- Use TDD for every task: write or update failing tests before production code.
- Keep each task independently reviewable and commit after its checks pass.
- Do not remove existing list workflows. Additive DTO fields are allowed; breaking existing fields is not.
- Do not commit downloaded third-party assets until their provenance is recorded in `radar_source`.
- Do not run destructive git commands. Worktree creation for implementation must use `superpowers:using-git-worktrees`.

---

### Task 1: Backend Schema, Radar Seed, And SQLC Surface

**Files:**
- Create: `backend/migrations/000002_interactive_lineup_map.up.sql`
- Create: `backend/migrations/000002_interactive_lineup_map.down.sql`
- Create: `backend/assets/radars/.gitkeep`
- Add: `backend/assets/radars/de_ancient.png`
- Add: `backend/assets/radars/de_anubis.png`
- Add: `backend/assets/radars/de_cache.png`
- Add: `backend/assets/radars/de_dust2.png`
- Add: `backend/assets/radars/de_inferno.png`
- Add: `backend/assets/radars/de_mirage.png`
- Add: `backend/assets/radars/de_nuke.png`
- Add: `backend/assets/radars/de_overpass.png`
- Modify: `backend/internal/db/query.sql`
- Regenerate: `backend/internal/db/generated/db.go`
- Regenerate: `backend/internal/db/generated/models.go`
- Regenerate: `backend/internal/db/generated/query.sql.go`
- Test: `backend/tests/db/interactive_map_schema_test.go`

- [ ] **Step 1: Write failing migration tests**

Create `backend/tests/db/interactive_map_schema_test.go`:

```go
package db_test

import (
	"strings"
	"testing"
)

func TestInteractiveMapMigrationAddsRadarAndSpotSchema(t *testing.T) {
	content := strings.ToLower(readBackendFile(t, "migrations", "000002_interactive_lineup_map.up.sql"))
	required := []string{
		"alter table maps add column if not exists radar_image_path text",
		"alter table maps add column if not exists radar_source text",
		"alter table maps add column if not exists radar_width integer",
		"alter table maps add column if not exists radar_height integer",
		"create table if not exists map_spots",
		"spot_id integer generated by default as identity primary key",
		"kind text not null check (kind in ('throw', 'target'))",
		"status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'merged'))",
		"radius numeric(6,3) not null default 3.0 check (radius > 0 and radius <= 25)",
		"merged_into_spot_id integer references map_spots(spot_id) on delete set null",
		"alter table lineups add column if not exists throw_spot_id integer references map_spots(spot_id) on delete set null",
		"alter table lineups add column if not exists target_spot_id integer references map_spots(spot_id) on delete set null",
		"alter table lineups add column if not exists aim_x numeric(6,3) check (aim_x >= 0 and aim_x <= 100)",
		"alter table lineups add column if not exists aim_y numeric(6,3) check (aim_y >= 0 and aim_y <= 100)",
	}
	for _, text := range required {
		if !strings.Contains(content, text) {
			t.Fatalf("interactive migration missing %q", text)
		}
	}
}

func TestInteractiveMapMigrationSeedsCanonicalActivePool(t *testing.T) {
	content := strings.ToLower(readBackendFile(t, "migrations", "000002_interactive_lineup_map.up.sql"))
	for _, text := range []string{
		"de_ancient.png",
		"de_anubis.png",
		"de_cache.png",
		"de_dust2.png",
		"de_inferno.png",
		"de_mirage.png",
		"de_nuke.png",
		"de_overpass.png",
		"duplicate canonical map",
		"is_esports_pool = true",
	} {
		if !strings.Contains(content, text) {
			t.Fatalf("seed migration missing %q", text)
		}
	}
}

func TestActivePoolRadarPNGsArePresent(t *testing.T) {
	for _, name := range []string{
		"de_ancient.png",
		"de_anubis.png",
		"de_cache.png",
		"de_dust2.png",
		"de_inferno.png",
		"de_mirage.png",
		"de_nuke.png",
		"de_overpass.png",
	} {
		data := readBackendFileBytes(t, "assets", "radars", name)
		if len(data) < 8 || string(data[:8]) != "\x89PNG\r\n\x1a\n" {
			t.Fatalf("%s is not a PNG file", name)
		}
	}
}

func TestInteractiveMapDownMigrationDropsInDependencyOrder(t *testing.T) {
	content := strings.ToLower(readBackendFile(t, "migrations", "000002_interactive_lineup_map.down.sql"))
	expectedOrder := []string{
		"alter table lineups drop column if exists aim_y",
		"alter table lineups drop column if exists aim_x",
		"alter table lineups drop column if exists target_spot_id",
		"alter table lineups drop column if exists throw_spot_id",
		"drop table if exists map_spots",
		"alter table maps drop column if exists radar_height",
		"alter table maps drop column if exists radar_width",
		"alter table maps drop column if exists radar_source",
		"alter table maps drop column if exists radar_image_path",
	}
	lastIndex := -1
	for _, text := range expectedOrder {
		index := strings.Index(content, text)
		if index == -1 {
			t.Fatalf("down migration missing %q", text)
		}
		if index <= lastIndex {
			t.Fatalf("%q appears out of dependency order", text)
		}
		lastIndex = index
	}
}
```

Add `readBackendFileBytes(t, parts ...string) []byte` next to the existing `readBackendFile` helper so the PNG signature check reads bytes without lossy string conversion.

- [ ] **Step 2: Run schema tests and verify failure**

Run:

```bash
cd backend && go test ./tests/db -run 'TestInteractiveMap' -count=1
```

Expected: FAIL because `000002_interactive_lineup_map.up.sql`, `.down.sql`, and the active-pool radar PNGs do not exist.

- [ ] **Step 3: Add migration files**

Create `backend/migrations/000002_interactive_lineup_map.up.sql` with these sections:

```sql
alter table maps add column if not exists radar_image_path text;
alter table maps add column if not exists radar_source text;
alter table maps add column if not exists radar_width integer;
alter table maps add column if not exists radar_height integer;

create table if not exists map_spots (
    spot_id integer generated by default as identity primary key,
    map_id integer not null references maps(map_id) on delete cascade,
    kind text not null check (kind in ('throw', 'target')),
    x numeric(6,3) not null check (x >= 0 and x <= 100),
    y numeric(6,3) not null check (y >= 0 and y <= 100),
    radius numeric(6,3) not null default 3.0 check (radius > 0 and radius <= 25),
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'merged')),
    name text,
    suggested_name text,
    created_by integer references users(user_id) on delete set null,
    approved_by integer references users(user_id) on delete set null,
    merged_into_spot_id integer references map_spots(spot_id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists map_spots_map_kind_status_idx on map_spots(map_id, kind, status);
create index if not exists map_spots_map_kind_xy_idx on map_spots(map_id, kind, x, y);
create index if not exists map_spots_merged_into_idx on map_spots(merged_into_spot_id) where merged_into_spot_id is not null;

alter table lineups add column if not exists throw_spot_id integer references map_spots(spot_id) on delete set null;
alter table lineups add column if not exists target_spot_id integer references map_spots(spot_id) on delete set null;
alter table lineups add column if not exists aim_x numeric(6,3) check (aim_x >= 0 and aim_x <= 100);
alter table lineups add column if not exists aim_y numeric(6,3) check (aim_y >= 0 and aim_y <= 100);

-- Seed block must:
-- 1. canonicalize existing names in SQL;
-- 2. fail on duplicate canonical map rows with raise exception 'duplicate canonical map';
-- 3. update exactly one match in place or insert if no row matches;
-- 4. set is_esports_pool=true and radar_image_path/radar_source/radar_width/radar_height.
```

Implement the seed block as a PostgreSQL `do` block with the spec aliases and `radar_source = 'MurkyYT/cs2-map-icons, local copy'`. Use `nullif` only for optional `link`; do not rewrite existing `map_id` values.

Create `backend/migrations/000002_interactive_lineup_map.down.sql`:

```sql
alter table lineups drop column if exists aim_y;
alter table lineups drop column if exists aim_x;
alter table lineups drop column if exists target_spot_id;
alter table lineups drop column if exists throw_spot_id;

drop table if exists map_spots;

alter table maps drop column if exists radar_height;
alter table maps drop column if exists radar_width;
alter table maps drop column if exists radar_source;
alter table maps drop column if exists radar_image_path;
```

- [ ] **Step 4: Add SQLC queries**

Modify `backend/internal/db/query.sql`:

```sql
-- Extend map selects with radar_image_path, radar_source, radar_width, radar_height.

-- Extend lineup selects with throw_spot_id, target_spot_id, aim_x, aim_y.

-- name: FindReusableMapSpot :many
select spot_id, map_id, kind, x, y, radius, status, name, suggested_name, created_by, approved_by, merged_into_spot_id, created_at, updated_at,
       ((x - sqlc.arg('x')::numeric) * (x - sqlc.arg('x')::numeric) + (y - sqlc.arg('y')::numeric) * (y - sqlc.arg('y')::numeric)) as distance_sq
from map_spots
where map_id = sqlc.arg('map_id')::int
  and kind = sqlc.arg('kind')::text
  and status in ('approved', 'pending')
  and ((x - sqlc.arg('x')::numeric) * (x - sqlc.arg('x')::numeric) + (y - sqlc.arg('y')::numeric) * (y - sqlc.arg('y')::numeric)) <= radius * radius
order by distance_sq asc, spot_id asc;

-- name: CreateMapSpot :one
insert into map_spots (map_id, kind, x, y, radius, status, suggested_name, created_by)
values ($1, $2, $3, $4, 3.0, 'pending', $5, $6)
returning spot_id, map_id, kind, x, y, radius, status, name, suggested_name, created_by, approved_by, merged_into_spot_id, created_at, updated_at;

-- name: GetMapSpotByID :one
select spot_id, map_id, kind, x, y, radius, status, name, suggested_name, created_by, approved_by, merged_into_spot_id, created_at, updated_at
from map_spots
where spot_id = $1;

-- name: ListMapSpots :many
select spot_id, map_id, kind, x, y, radius, status, name, suggested_name, created_by, approved_by, merged_into_spot_id, created_at, updated_at
from map_spots
where (sqlc.narg('map_id')::int is null or map_id = sqlc.narg('map_id')::int)
  and (sqlc.narg('kind')::text is null or kind = sqlc.narg('kind')::text)
  and (sqlc.narg('status')::text is null or status = sqlc.narg('status')::text)
  and (sqlc.narg('query')::text is null or lower(coalesce(name, '') || ' ' || coalesce(suggested_name, '')) like '%' || lower(sqlc.narg('query')::text) || '%')
order by updated_at desc, spot_id desc;

-- name: UpdateMapSpot :one
update map_spots
set x = $2, y = $3, radius = $4, status = $5, name = $6, suggested_name = $7, approved_by = $8, merged_into_spot_id = $9, updated_at = now()
where spot_id = $1
returning spot_id, map_id, kind, x, y, radius, status, name, suggested_name, created_by, approved_by, merged_into_spot_id, created_at, updated_at;

-- name: ReassignThrowSpotLineups :exec
update lineups set throw_spot_id = $2, updated_at = now() where throw_spot_id = $1;

-- name: ReassignTargetSpotLineups :exec
update lineups set target_spot_id = $2, updated_at = now() where target_spot_id = $1;

-- name: ListPublicMapSpots :many
select s.spot_id, s.map_id, s.kind, s.x, s.y, s.radius, s.status, s.name, s.suggested_name, count(l.grenade_id)::int as lineup_count
from map_spots s
join lineups l on (sqlc.arg('kind')::text = 'throw' and l.throw_spot_id = s.spot_id) or (sqlc.arg('kind')::text = 'target' and l.target_spot_id = s.spot_id)
join users u on u.user_id = l.user_id
where s.map_id = sqlc.arg('map_id')::int
  and s.kind = sqlc.arg('kind')::text
  and s.status = 'approved'
  and l.is_approved = true
  and (sqlc.narg('grenade_class_id')::int is null or l.grenade_class_id = sqlc.narg('grenade_class_id')::int)
  and (sqlc.narg('query')::text is null or lower(l.title || ' ' || coalesce(l.description, '')) like '%' || lower(sqlc.narg('query')::text) || '%')
  and (sqlc.narg('by_user_name')::text is null or lower(u.username) like '%' || lower(sqlc.narg('by_user_name')::text) || '%')
group by s.spot_id
having count(l.grenade_id) > 0
order by s.spot_id asc;

-- name: ListPublicMapSpotRepresentativeLineups :many
with matching_lineups as (
  select s.spot_id as marker_spot_id,
         l.grenade_id, l.map_id, l.user_id, l.grenade_class_id, l.link_to_video, l.title, l.description, l.is_approved, l.views, l.preview_image_path, l.created_at,
         l.throw_spot_id, l.target_spot_id, l.aim_x, l.aim_y,
         row_number() over (partition by s.spot_id order by l.views desc, l.created_at desc, l.grenade_id desc) as representative_rank
  from map_spots s
  join lineups l on (sqlc.arg('kind')::text = 'throw' and l.throw_spot_id = s.spot_id) or (sqlc.arg('kind')::text = 'target' and l.target_spot_id = s.spot_id)
  join users u on u.user_id = l.user_id
  where s.map_id = sqlc.arg('map_id')::int
    and s.kind = sqlc.arg('kind')::text
    and s.status = 'approved'
    and l.is_approved = true
    and s.spot_id = any(sqlc.arg('spot_ids')::int[])
    and (sqlc.narg('grenade_class_id')::int is null or l.grenade_class_id = sqlc.narg('grenade_class_id')::int)
    and (sqlc.narg('query')::text is null or lower(l.title || ' ' || coalesce(l.description, '')) like '%' || lower(sqlc.narg('query')::text) || '%')
    and (sqlc.narg('by_user_name')::text is null or lower(u.username) like '%' || lower(sqlc.narg('by_user_name')::text) || '%')
)
select *
from matching_lineups
where representative_rank <= 5
order by marker_spot_id asc, representative_rank asc;

-- name: ListUnplacedLineups :many
select distinct l.grenade_id, l.map_id, l.user_id, l.grenade_class_id, l.link_to_video, l.title, l.description, l.is_approved, l.views, l.preview_image_path, l.created_at,
       l.throw_spot_id, l.target_spot_id, l.aim_x, l.aim_y
from lineups l
left join pull_requests pr on pr.lineup_id = l.grenade_id
where (l.throw_spot_id is null or l.target_spot_id is null or l.aim_x is null or l.aim_y is null)
  and (l.is_approved = true or pr.status = 'OPEN')
order by l.created_at desc, l.grenade_id desc;
```

- [ ] **Step 5: Regenerate SQLC**

Run:

```bash
cd backend && go run github.com/sqlc-dev/sqlc/cmd/sqlc@v1.30.0 generate -f sqlc.yaml
```

Expected: generated files update and `generated.MapSpot` appears in `backend/internal/db/generated/models.go`.

- [ ] **Step 6: Add and verify active-pool radar PNGs**

Run:

```bash
mkdir -p backend/assets/radars
touch backend/assets/radars/.gitkeep
tmp_dir="$(mktemp -d)"
git clone --depth 1 https://github.com/MurkyYT/cs2-map-icons "$tmp_dir/cs2-map-icons"
for name in de_ancient.png de_anubis.png de_cache.png de_dust2.png de_inferno.png de_mirage.png de_nuke.png de_overpass.png; do
  src="$(find "$tmp_dir/cs2-map-icons" -type f -name "$name" -print -quit)"
  test -n "$src"
  cp "$src" "backend/assets/radars/$name"
done
file backend/assets/radars/de_*.png
```

- Use the source recorded in the migration seed: `MurkyYT/cs2-map-icons`.
- Store files exactly under `backend/assets/radars/` with the names in the file list above.
- Expected: every `file` output line contains `PNG image data`.

- [ ] **Step 7: Run backend schema checks**

Run:

```bash
cd backend && go test ./tests/db -count=1
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/migrations backend/internal/db backend/assets/radars backend/tests/db
git commit -m "feat: add interactive map schema"
```

---

### Task 2: Backend Spot Domain, Spatial DTOs, And Repository Normalization

**Files:**
- Create: `backend/internal/mapspots/dto.go`
- Create: `backend/internal/mapspots/repository.go`
- Modify: `backend/internal/lineups/dto.go`
- Modify: `backend/internal/lineups/filters.go`
- Modify: `backend/internal/lineups/repository.go`
- Modify: `backend/internal/platform/postgresrepo/lineups.go`
- Modify: `backend/internal/platform/postgresrepo/store.go`
- Modify: `backend/internal/platform/cache/lineups.go`
- Test: `backend/tests/postgresrepo/interactive_map_test.go`
- Test: `backend/tests/lineups/filters_test.go`

- [ ] **Step 1: Write failing repository tests for spot matching**

Create `backend/tests/postgresrepo/interactive_map_test.go` with three tests:

- `TestStoreCreateLineupReusesNearestApprovedOrPendingSpot`: `FindReusableMapSpot` returns two rows, and the repository writes the nearest row IDs into `CreateLineupParams.ThrowSpotID` and `CreateLineupParams.TargetSpotID`.
- `TestStoreCreateLineupExcludesRejectedAndMergedSpots`: the expected `FindReusableMapSpot` SQL contains `status in ('approved', 'pending')`, and `CreateMapSpot` is called when no reusable row is returned.
- `TestStoreCreateLineupCreatesPendingSpotWhenNoReusableSpotMatches`: `FindReusableMapSpot` returns no rows, `CreateMapSpot` inserts status `pending`, and the new `spot_id` is attached to the lineup.

Each test uses `pgxmock.NewPool()`, expects `FindReusableMapSpot`, `CreateMapSpot`, `CreateLineup` or `UpdateLineup`, and verifies this input shape:

```go
input := lineups.Input{
	MapID: 1,
	UserID: 7,
	GrenadeClassID: 1,
	Title: "Window smoke",
	ThrowPosition: &lineups.SpotPositionInput{X: 11.5, Y: 22.5, SuggestedName: stringPtr("T spawn door")},
	TargetPosition: &lineups.SpotPositionInput{X: 51.0, Y: 62.0, SuggestedName: stringPtr("Window")},
	AimPosition: &lineups.CoordinateInput{X: 33.0, Y: 44.0},
}
```

- [ ] **Step 2: Write failing filter test**

Extend `backend/tests/lineups/filters_test.go`:

```go
func TestParseFilterReadsGrenadeClassID(t *testing.T) {
	filter := lineups.ParseFilter(url.Values{"grenade_class_id": {"2"}})
	if filter.GrenadeClassID == nil || *filter.GrenadeClassID != 2 {
		t.Fatalf("GrenadeClassID = %#v", filter.GrenadeClassID)
	}
}
```

- [ ] **Step 3: Run focused tests and verify failure**

Run:

```bash
cd backend && go test ./tests/lineups ./tests/postgresrepo -run 'GrenadeClassID|Interactive|MapSpot|CreateLineupReuses' -count=1
```

Expected: FAIL because spatial types, repository methods, and SQLC calls are missing.

- [ ] **Step 4: Add map spot domain types**

Create `backend/internal/mapspots/dto.go`:

```go
package mapspots

type Kind string
type Status string

const (
	KindThrow  Kind = "throw"
	KindTarget Kind = "target"

	StatusPending  Status = "pending"
	StatusApproved Status = "approved"
	StatusRejected Status = "rejected"
	StatusMerged   Status = "merged"
)

type Coordinate struct {
	X float64
	Y float64
}

type Spot struct {
	SpotID           int
	MapID            int
	Kind             Kind
	X                float64
	Y                float64
	Radius           float64
	Status           Status
	Name             *string
	SuggestedName    *string
	CreatedBy        *int
	ApprovedBy       *int
	MergedIntoSpotID *int
	LineupCount      int
	RepresentativeLineups []RepresentativeLineup
}

type SpotDTO struct {
	SpotID                int                       `json:"spot_id"`
	MapID                 int                       `json:"map_id"`
	Kind                  string                    `json:"kind"`
	Name                  *string                   `json:"name"`
	X                     float64                   `json:"x"`
	Y                     float64                   `json:"y"`
	Radius                float64                   `json:"radius"`
	LineupCount           int                       `json:"lineup_count,omitempty"`
	RepresentativeLineups []RepresentativeLineupDTO `json:"representative_lineups,omitempty"`
}

type SpotSummaryDTO struct {
	SpotID      int     `json:"spot_id"`
	MapID       int     `json:"map_id"`
	Kind        string  `json:"kind"`
	Name        *string `json:"name"`
	X           float64 `json:"x"`
	Y           float64 `json:"y"`
	Radius      float64 `json:"radius"`
	LineupCount int     `json:"lineup_count,omitempty"`
}

type CoordinateDTO struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

type RepresentativeLineup struct {
	GrenadeID      int
	Title          string
	Description    *string
	GrenadeClassID int
	PreviewImage   *string
	ThrowSpot      *Spot
	TargetSpot     *Spot
	Aim            *Coordinate
}

type RepresentativeLineupDTO struct {
	GrenadeID      int            `json:"grenade_id"`
	Title          string         `json:"title"`
	Description    *string        `json:"description"`
	GrenadeClassID int            `json:"grenade_class_id"`
	PreviewImage   *string        `json:"preview_image_link"`
	ThrowSpot      *SpotSummaryDTO `json:"throw_spot"`
	TargetSpot     *SpotSummaryDTO `json:"target_spot"`
	AimPosition    *CoordinateDTO `json:"aim_position"`
}

func ToDTO(spot Spot) SpotDTO {
	return SpotDTO{SpotID: spot.SpotID, MapID: spot.MapID, Kind: string(spot.Kind), Name: spot.Name, X: spot.X, Y: spot.Y, Radius: spot.Radius, LineupCount: spot.LineupCount}
}
```

Update `ToDTO` to include `RepresentativeLineups` in public responses without importing `lineups`, so `mapspots` remains a leaf domain package. Convert nested representative `throw_spot` and `target_spot` through `SpotSummaryDTO` so public spot responses cannot recursively embed more `representative_lineups`.

Create `backend/internal/mapspots/repository.go`:

```go
package mapspots

import (
	"context"
	"errors"
	"strings"
)

var ErrNotFound = errors.New("not found")

type ValidationError struct {
	Fields []string
	Code   string
}

func (e ValidationError) Error() string {
	if e.Code != "" {
		return e.Code
	}
	return "invalid " + strings.Join(e.Fields, ", ")
}

type Filter struct {
	MapID  *int
	Kind   string
	Status string
	Query  string
}

type PublicFilter struct {
	Kind           string
	GrenadeClassID *int
	Query          string
	ByUserName     string
	Ordering       string
}

type Input struct {
	X                *float64
	Y                *float64
	Radius           *float64
	Status           *Status
	Name             *string
	SuggestedName    *string
	ApprovedBy       *int
	MergedIntoSpotID *int
}

type Repository interface {
	ListMapSpots(ctx context.Context, filter Filter) ([]Spot, error)
	ListPublicMapSpots(ctx context.Context, mapID int, filter PublicFilter) ([]Spot, error)
	ListPublicMapSpotLineups(ctx context.Context, mapID int, spotIDs []int, filter PublicFilter) (map[int][]RepresentativeLineup, error)
	GetMapSpot(ctx context.Context, id int) (Spot, error)
	PatchMapSpot(ctx context.Context, id int, input Input) (Spot, error)
	ApproveMapSpot(ctx context.Context, id int, actorID int) (Spot, error)
	RejectMapSpot(ctx context.Context, id int, actorID int) (Spot, error)
	MergeMapSpot(ctx context.Context, sourceID int, targetID int, actorID int) (Spot, error)
}
```

- [ ] **Step 5: Add spatial fields to lineup domain**

Modify `backend/internal/lineups/dto.go`:

```go
type CoordinateInput struct {
	X float64
	Y float64
}

type SpotPositionInput struct {
	X             float64
	Y             float64
	SuggestedName *string
}

type Lineup struct {
	// existing fields
	ThrowSpot  *mapspots.Spot
	TargetSpot *mapspots.Spot
	Aim        *mapspots.Coordinate
}

type LineupDTO struct {
	// existing fields
	ThrowSpot   *mapspots.SpotDTO       `json:"throw_spot"`
	TargetSpot  *mapspots.SpotDTO       `json:"target_spot"`
	AimPosition *mapspots.CoordinateDTO `json:"aim_position"`
}

type Input struct {
	// existing fields
	ThrowPosition  *SpotPositionInput
	TargetPosition *SpotPositionInput
	AimPosition    *CoordinateInput
	ClearThrowSpot bool
	ClearTargetSpot bool
	ClearAim        bool
}
```

Update `ToDTO` so nil fields serialize as `null`; non-nil fields use `mapspots.ToDTO`.

- [ ] **Step 6: Extend filters and SQLC params**

Modify `backend/internal/lineups/filters.go`:

```go
type Filter struct {
	IsApproved       *bool
	GrenadeClassID   *int
	Ordering         string
	Query            string
	ByUserName       string
	CreatorIDIgnored string
}
```

Parse `grenade_class_id` with `strconv.Atoi`; invalid or absent values keep `nil`.

Update `ListLineupsFiltered` SQL with:

```sql
and (sqlc.narg('grenade_class_id')::int is null or l.grenade_class_id = sqlc.narg('grenade_class_id')::int)
```

- [ ] **Step 7: Implement repository normalization**

In `backend/internal/platform/postgresrepo/lineups.go`, add helper:

```go
func (s *Store) resolveSpot(ctx context.Context, mapID int, kind mapspots.Kind, input *lineups.SpotPositionInput, actorID int) (*int, error) {
	if input == nil {
		return nil, nil
	}
	rows, err := s.q.FindReusableMapSpot(ctx, generated.FindReusableMapSpotParams{MapID: int32(mapID), Kind: string(kind), X: numeric(input.X), Y: numeric(input.Y)})
	if err != nil {
		return nil, err
	}
	if len(rows) > 0 {
		id := int(rows[0].SpotID)
		return &id, nil
	}
	row, err := s.q.CreateMapSpot(ctx, generated.CreateMapSpotParams{
		MapID: int32(mapID), Kind: string(kind), X: numeric(input.X), Y: numeric(input.Y),
		SuggestedName: textValue(input.SuggestedName), CreatedBy: int4Ptr(actorID),
	})
	if err != nil {
		return nil, err
	}
	id := int(row.SpotID)
	return &id, nil
}
```

Use `resolveSpot` in create/update before `CreateLineup`/`UpdateLineup`. Add numeric conversion helpers using `pgtype.Numeric`.

- [ ] **Step 8: Run focused repository and filter tests**

Run:

```bash
cd backend && go test ./tests/lineups ./tests/postgresrepo -run 'GrenadeClassID|MapSpot|CreateLineup' -count=1
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add backend/internal/mapspots backend/internal/lineups backend/internal/platform/postgresrepo backend/internal/platform/cache backend/internal/db backend/tests/lineups backend/tests/postgresrepo
git commit -m "feat: normalize lineup map spots"
```

---

### Task 3: Backend Public API, Radar Serving, And OpenAPI

**Files:**
- Modify: `backend/internal/maps/dto.go`
- Modify: `backend/internal/maps/handlers.go`
- Modify: `backend/internal/maps/routes.go`
- Modify: `backend/internal/mapspots/handlers.go`
- Modify: `backend/internal/mapspots/routes.go`
- Modify: `backend/internal/platform/httpserver/server.go`
- Modify: `backend/internal/openapi/openapi.go`
- Test: `backend/tests/maps/handlers_test.go`
- Test: `backend/tests/lineups/handlers_test.go`
- Test: `backend/tests/httpserver/repository_wiring_test.go`
- Test: `backend/tests/openapi/handlers_test.go`

- [ ] **Step 1: Write failing handler tests**

Add these tests with concrete assertions:

- `TestMapDTOIncludesRadarFieldsAndNullMissingAsset`: map detail includes `radar_image_link`, `radar_source`, `radar_width`, `radar_height`; when the local PNG is absent, `radar_image_link` is `null`.
- `TestRadarAssetRouteServesOnlyLocalPNGs`: `/api/radars/de_mirage.png` returns `200 image/png` for a local file; `/api/radars/../secret.png` and `/api/radars/de_mirage.svg` return `404`.
- `TestPublicMapSpotsRejectsUnsupportedIsApprovedFilter`: `/api/maps/1/spots?is_approved=false` returns `400` and includes `unsupported-filter`.
- `TestPublicMapSpotsReturnsApprovedMarkersWithCountsAndRepresentatives`: `/api/maps/1/spots?kind=throw&grenade_class_id=1` returns only approved spots with approved lineup counts and `representative_lineups`.
- `TestPublicMapSpotRepresentativesUseSameFiltersAsCounts`: representatives exclude lineups filtered out by `grenade_class_id`, `query`, or `by_user_name`, and each representative belongs to the marker spot through the requested `kind`.
- `TestLineupDTOIncludesSpotAndAimFields`: lineup detail returns `throw_spot`, `target_spot`, and `aim_position`.
- `TestLineupMultipartRejectsPartialCoordinatePairs`: `throw_x` without `throw_y` returns `400` and field-specific errors.
- `TestLineupMultipartPatchNullClearsNullableSpatialFields`: PATCH with both `aim_x=null` and `aim_y=null` clears `aim_position`; omitted spatial fields preserve existing values.
- `TestLineupMultipartRejectsNullForRequiredFields`: PATCH or create with literal `null` for non-nullable fields such as `title`, `map_id`, or `grenade_class_id` returns field-specific `400` errors.

Use assertions:

```go
if body["radar_image_link"] != nil {
	t.Fatalf("missing local radar should return null link: %#v", body)
}
if recorder.Code != http.StatusBadRequest || !strings.Contains(recorder.Body.String(), "unsupported-filter") {
	t.Fatalf("unexpected unsupported filter response: %d %s", recorder.Code, recorder.Body.String())
}
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
cd backend && go test ./tests/maps ./tests/lineups ./tests/httpserver ./tests/openapi -run 'Radar|Spots|SpotAndAim|Coordinate|OpenAPI' -count=1
```

Expected: FAIL because routes and DTO fields are missing.

- [ ] **Step 3: Add radar DTO and serving**

Modify `maps.Map` and `maps.MapDTO`:

```go
RadarImagePath *string
RadarSource    *string
RadarWidth     *int
RadarHeight    *int
```

Generate `RadarImageLink` from local `backend/assets/radars` existence, not `MEDIA_ROOT`. Add `GET /api/radars/{file_name}` in `httpserver.NewWithRepositories`; reject names containing `/`, `\`, or `..`; serve only `.png`.

- [ ] **Step 4: Add public spots route**

Create route:

```go
router.Get("/api/maps/{id}/spots", spotHandler.PublicList)
router.Get("/api/maps/{id}/spots/", spotHandler.PublicList)
```

`PublicList` must:

- default `kind` to `throw`;
- accept only `throw` or `target`;
- reject supplied `is_approved` with `400 unsupported-filter`;
- pass `grenade_class_id`, `query`, `by_user_name`, `ordering` to repository;
- load representative lineups for the returned spot IDs with the same filter object used for counts;
- return `[]mapspots.SpotDTO` with `lineup_count` and `representative_lineups`, where each representative includes enough card data plus `throw_spot`, `target_spot`, and `aim_position` for bottom-sheet grouping.

- [ ] **Step 5: Parse spatial multipart fields**

In `lineups.decodeMultipart`, parse:

```go
throw_x, throw_y, throw_spot_name
target_x, target_y, target_spot_name
aim_x, aim_y
```

Validation rules:

- one coordinate in a pair without the other returns `400` field-specific JSON;
- values outside `0..100` return `400`;
- omitted pairs preserve existing values on PATCH;
- on multipart PATCH, known nullable fields sent with the literal text value `null` clear that field;
- for coordinate pairs, both fields in the pair must be omitted, both concrete numeric values, or both literal `null`; mixed/missing pairs return field-specific `400` errors;
- non-nullable fields sent as literal `null` return field-specific `400` errors instead of being coerced.

- [ ] **Step 6: Update OpenAPI**

Add schema fields:

```go
"MapSpotSummary": objectProps(map[string]any{"spot_id": integer(), "map_id": integer(), "kind": stringSchema(), "name": nullableString(), "x": number(), "y": number(), "radius": number(), "lineup_count": integer()}),
"MapSpotRepresentativeLineup": objectProps(map[string]any{"grenade_id": integer(), "title": stringSchema(), "description": nullableString(), "grenade_class_id": integer(), "preview_image_link": nullableString(), "throw_spot": nullableRef("MapSpotSummary"), "target_spot": nullableRef("MapSpotSummary"), "aim_position": nullableRef("Coordinate")}),
"MapSpot": objectProps(map[string]any{"spot_id": integer(), "map_id": integer(), "kind": stringSchema(), "name": nullableString(), "x": number(), "y": number(), "radius": number(), "lineup_count": integer(), "representative_lineups": array(ref("MapSpotRepresentativeLineup"))}),
"Coordinate": objectProps(map[string]any{"x": number(), "y": number()}),
"Lineup": objectProps(map[string]any{"user_id": integer(), "grenade_id": integer(), "map_id": integer(), "throw_spot": nullableRef("MapSpot"), "target_spot": nullableRef("MapSpot"), "aim_position": nullableRef("Coordinate")}),
"MapDetail": objectProps(map[string]any{"map_id": integer(), "name": stringSchema(), "link": nullableString(), "is_esports_pool": boolean(), "image_link": nullableString(), "radar_image_link": nullableString(), "radar_source": nullableString(), "radar_width": nullableInteger(), "radar_height": nullableInteger(), "map_lineups": array(object())}),
```

Document multipart PATCH clear semantics in the request body description: omitted fields preserve existing values, literal `null` clears known nullable fields, and literal `null` on non-nullable fields returns validation errors.

Add paths:

```go
"/api/maps/{id}/spots"
"/api/admin/map-spots"
"/api/admin/lineups/unplaced"
"/api/radars/{file_name}"
```

- [ ] **Step 7: Run focused backend API tests**

Run:

```bash
cd backend && go test ./tests/maps ./tests/lineups ./tests/httpserver ./tests/openapi -count=1
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/internal/maps backend/internal/mapspots backend/internal/lineups backend/internal/platform/httpserver backend/internal/openapi backend/tests
git commit -m "feat: expose radar spots API"
```

---

### Task 4: Backend Admin Spot Tooling And Moderation Blocking

**Files:**
- Modify: `backend/internal/admin/handler.go`
- Modify: `backend/internal/mapspots/handlers.go`
- Modify: `backend/internal/mapspots/repository.go`
- Modify: `backend/internal/platform/postgresrepo/pullrequests.go`
- Modify: `backend/internal/platform/postgresrepo/store.go`
- Modify: `backend/internal/platform/httpserver/server.go`
- Test: `backend/tests/admin/handlers_test.go`
- Test: `backend/tests/pullrequests/handlers_test.go`
- Test: `backend/tests/postgresrepo/interactive_map_test.go`

- [ ] **Step 1: Write failing admin tests**

Add these tests with explicit assertions:

- `TestAdminMapSpotApproveRejectAndMergeRequireBaseAdmin`: editor receives `403` for approve/reject/merge; base admin receives `200`.
- `TestAdminMapSpotPatchAllowsEditorsForPendingMetadata`: editor can patch `name`, `suggested_name`, `x`, `y`, and `radius` for a pending spot.
- `TestAdminUnplacedLineupsQueueUsesApprovedAndOpenPRRules`: response includes approved legacy unplaced lineups and unapproved lineups with `OPEN` PR; excludes rejected/closed PR lineups.
- `TestPullRequestApprovalBlocksPendingRequiredSpots`: approval returns `409 spot_review_required`.
- `TestPullRequestApprovalBlocksRejectedOrMissingRequiredSpots`: approval returns `409 spot_correction_required`.
- `TestStoreMergeMapSpotsReassignsLineupsAndMarksSourceMerged`: source/target same `map_id` and `kind` are validated, lineups are reassigned, source status becomes `merged`, and `merged_into_spot_id` is set.
- `TestStoreMergeMapSpotsUsesSingleTransaction`: repository begins one transaction, runs both spot loads, lineup reassignment, source update, and commit on that transaction; on any error it rolls back.

Assertions:

```go
if recorder.Code != http.StatusConflict || !strings.Contains(recorder.Body.String(), "spot_review_required") {
	t.Fatalf("pending spot approval response = %d %s", recorder.Code, recorder.Body.String())
}
if recorder.Code != http.StatusConflict || !strings.Contains(recorder.Body.String(), "spot_correction_required") {
	t.Fatalf("missing spot approval response = %d %s", recorder.Code, recorder.Body.String())
}
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
cd backend && go test ./tests/admin ./tests/pullrequests ./tests/postgresrepo -run 'MapSpot|Unplaced|SpotReview|SpotCorrection|ApprovalBlocks|Merge' -count=1
```

Expected: FAIL because admin endpoints and moderation gate are missing.

- [ ] **Step 3: Implement admin endpoints**

Register:

```go
GET /api/admin/map-spots
GET /api/admin/map-spots/{id}
PATCH /api/admin/map-spots/{id}
POST /api/admin/map-spots/{id}/approve
POST /api/admin/map-spots/{id}/reject
POST /api/admin/map-spots/{id}/merge
GET /api/admin/lineups/unplaced
```

Permission matrix:

- editor/base_admin/superuser: list/detail and patch pending metadata;
- base_admin/superuser: approve, reject, merge;
- 401/403 match existing admin behavior.

- [ ] **Step 4: Implement merge transaction**

First make `postgresrepo.Store` transaction-capable. `Store` currently only keeps `q *generated.Queries`, so add a retained DB handle that can start transactions, for example:

```go
type txBeginner interface {
	Begin(ctx context.Context) (pgx.Tx, error)
}

type Store struct {
	q       *generated.Queries
	db      generated.DBTX
	beginner txBeginner
}
```

Update `New(db generated.DBTX)` to keep `db`, initialize `q := generated.New(db)`, and set `beginner` when `db` implements the transaction interface used by pgx pools/connections. Update postgresrepo tests and constructors to pass a transaction-capable mock/pool for merge tests.

Then implement `MergeMapSpot(ctx, sourceID, targetID, actorID)` by opening a transaction from `beginner`, creating transaction-scoped queries with `generated.New(tx)` or the generated `WithTx(tx)` helper if present, loading both spots with `GetMapSpotByID`, returning validation code `spot_merge_mismatch` when `map_id` or `kind` differ, calling `ReassignThrowSpotLineups` for `kind='throw'` or `ReassignTargetSpotLineups` for `kind='target'`, updating the source spot with `status='merged'`, `merged_into_spot_id=targetID`, and `approved_by=actorID`, committing, and returning the updated source spot. Defer rollback so every validation or SQL error before commit releases the transaction.

Different map/kind returns validation error mapped to `400`.

- [ ] **Step 5: Implement PR approval blocking**

Before calling `UpdatePullRequestStatus` with status `APPROVED`, load the target lineup spatial state:

- if new tg-frontend submission has required spatial fields and either spot is `pending`, return conflict `spot_review_required`;
- if required spot reference is missing or rejected, return conflict `spot_correction_required`;
- if legacy lineup lacks spatial fields and is already approved, leave normal list behavior unchanged and keep it absent from markers.

- [ ] **Step 6: Run admin/moderation tests**

Run:

```bash
cd backend && go test ./tests/admin ./tests/pullrequests ./tests/postgresrepo -count=1
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/internal/admin backend/internal/mapspots backend/internal/platform backend/tests/admin backend/tests/pullrequests backend/tests/postgresrepo
git commit -m "feat: add map spot moderation"
```

---

### Task 5: tg-frontend Contracts, Coordinate Math, And API Clients

**Files:**
- Modify: `tg-frontend/src/entities/map/model/domain.ts`
- Modify: `tg-frontend/src/entities/map/lib/dto-transformer.ts`
- Modify: `tg-frontend/src/entities/map/api/client.ts`
- Modify: `tg-frontend/src/entities/grenade/model/domain.ts`
- Modify: `tg-frontend/src/entities/grenade/lib/dto-transformer.ts`
- Create: `tg-frontend/src/entities/map-spot/model/domain.ts`
- Create: `tg-frontend/src/entities/map-spot/lib/coordinates.ts`
- Create: `tg-frontend/src/entities/map-spot/api/client.ts`
- Create: `tg-frontend/src/entities/map-spot/index.ts`
- Test: `tg-frontend/src/entities/map/lib/dto-transformer.test.ts`
- Test: `tg-frontend/src/entities/grenade/lib/dto-transformer.test.ts`
- Test: `tg-frontend/src/entities/map-spot/lib/coordinates.test.ts`

- [ ] **Step 1: Write failing zod and coordinate tests**

Add coordinate tests:

```ts
import { describe, expect, it } from "vitest"
import { quadrantForPoint, toGlobalPercent, toNormalizedPoint } from "./coordinates"

describe("map spot coordinates", () => {
    it("converts viewport clicks to normalized 0..100 coordinates", () => {
        expect(toNormalizedPoint({ clientX: 150, clientY: 250 }, { left: 50, top: 50, width: 200, height: 400 })).toEqual({ x: 50, y: 50 })
    })

    it("maps a quadrant-local click back to global coordinates", () => {
        expect(toGlobalPercent({ x: 50, y: 50 }, "bottom-right")).toEqual({ x: 75, y: 75 })
    })

    it("selects one of four fixed quadrants", () => {
        expect(quadrantForPoint({ x: 20, y: 20 })).toBe("top-left")
        expect(quadrantForPoint({ x: 80, y: 20 })).toBe("top-right")
        expect(quadrantForPoint({ x: 20, y: 80 })).toBe("bottom-left")
        expect(quadrantForPoint({ x: 80, y: 80 })).toBe("bottom-right")
    })
})
```

Add DTO tests that parse nullable radar fields, `throw_spot`, `target_spot`, `aim_position`, and public map spots with `lineup_count` plus `representative_lineups`.

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
cd tg-frontend && npm run test -- src/entities/map src/entities/grenade src/entities/map-spot
```

Expected: FAIL because map-spot entity and DTO fields are missing.

- [ ] **Step 3: Add map spot entity and coordinate helpers**

Create `coordinates.ts`:

```ts
export type NormalizedPoint = { x: number; y: number }
export type Quadrant = "top-left" | "top-right" | "bottom-left" | "bottom-right"

export function clampPercent(value: number): number {
    return Math.max(0, Math.min(100, Number(value.toFixed(3))))
}

export function toNormalizedPoint(event: { clientX: number; clientY: number }, rect: Pick<DOMRect, "left" | "top" | "width" | "height">): NormalizedPoint {
    return { x: clampPercent(((event.clientX - rect.left) / rect.width) * 100), y: clampPercent(((event.clientY - rect.top) / rect.height) * 100) }
}

export function quadrantForPoint(point: NormalizedPoint): Quadrant {
    if (point.x < 50 && point.y < 50) return "top-left"
    if (point.x >= 50 && point.y < 50) return "top-right"
    if (point.x < 50 && point.y >= 50) return "bottom-left"
    return "bottom-right"
}

export function toGlobalPercent(point: NormalizedPoint, quadrant: Quadrant): NormalizedPoint {
    const offsetX = quadrant.endsWith("right") ? 50 : 0
    const offsetY = quadrant.startsWith("bottom") ? 50 : 0
    return { x: clampPercent(offsetX + point.x / 2), y: clampPercent(offsetY + point.y / 2) }
}
```

- [ ] **Step 4: Extend DTOs and API**

Add `MapSpotDTO`, `CoordinateDTO`, `MapSpotRepresentativeLineupDTO`, and zod schemas. Add `getMapSpotsOptions(mapId, params)` in map-spot API using `/maps/${mapId}/spots`; preserve `representative_lineups` on the frontend model as `representativeLineups` so the interactive map can render bottom-sheet cards without issuing an unfiltered lineup request.

- [ ] **Step 5: Run frontend entity tests**

Run:

```bash
cd tg-frontend && npm run test -- src/entities/map src/entities/grenade src/entities/map-spot
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tg-frontend/src/entities/map tg-frontend/src/entities/grenade tg-frontend/src/entities/map-spot
git commit -m "feat: add frontend map spot contracts"
```

---

### Task 6: tg-frontend Interactive Map Browsing

**Files:**
- Create: `tg-frontend/src/features/map/radar-picker/ui/radar-picker.tsx`
- Create: `tg-frontend/src/features/map/radar-picker/ui/radar-picker.module.scss`
- Create: `tg-frontend/src/features/map/radar-picker/index.ts`
- Create: `tg-frontend/src/widgets/interactive-map/ui/interactive-map.tsx`
- Create: `tg-frontend/src/widgets/interactive-map/ui/interactive-map.module.scss`
- Create: `tg-frontend/src/widgets/interactive-map/index.ts`
- Modify: `tg-frontend/src/widgets/map-overview/ui/map-overview.tsx`
- Modify: `tg-frontend/src/widgets/map-overview/ui/map-overview.module.scss`
- Modify: `tg-frontend/package.json`
- Modify: `tg-frontend/package-lock.json` or the active npm lockfile if present
- Test: `tg-frontend/src/widgets/interactive-map/ui/interactive-map.test.tsx`
- Test: `tg-frontend/src/features/map/radar-picker/ui/radar-picker.test.tsx`

- [ ] **Step 1: Write failing component tests**

First add component-test dependencies if they are not already installed:

```bash
cd tg-frontend && npm install --save-dev @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

Add `test.environment = "jsdom"` to the Vite/Vitest config if the project config does not already provide a DOM environment for `.test.tsx` files. Also load `@testing-library/jest-dom/vitest` through a Vitest setup file or import it in each component test that uses DOM matchers such as `toBeInTheDocument`.

Test behaviors with React Testing Library:

```tsx
render(<InteractiveMap mapId={1} />)
expect(await screen.findByRole("button", { name: "Throw" })).toHaveAttribute("aria-pressed", "true")
expect(screen.getByRole("button", { name: "Target" })).toHaveAttribute("aria-pressed", "false")
```

```tsx
await user.click(await screen.findByRole("button", { name: /spot t spawn door/i }))
expect(await screen.findByRole("dialog")).toHaveTextContent("T spawn door")
expect(screen.getByRole("dialog")).toHaveTextContent("3 lineups")
expect(screen.getByRole("dialog")).toHaveTextContent("Window smoke")
```

```tsx
const capturedSpotRequests: URL[] = []
const targetSpotDto = { spot_id: 2, map_id: 1, kind: "target", name: "Window", x: 50, y: 60, radius: 3, lineup_count: 1 }
server.use(mapSpotsHandler({ representative_lineups: [{ grenade_id: 7, title: "Window smoke", target_spot: targetSpotDto }] }, request => capturedSpotRequests.push(new URL(request.url))))
render(<InteractiveMap mapId={1} filters={{ grenadeClassId: 1, query: "window" }} />)
await user.click(await screen.findByRole("button", { name: /spot t spawn door/i }))
expect(screen.getByRole("dialog")).toHaveTextContent("Window smoke")
expect(capturedSpotRequests.at(-1)?.searchParams.get("grenade_class_id")).toBe("1")
expect(capturedSpotRequests.at(-1)?.searchParams.get("query")).toBe("window")
```

```tsx
await user.click(screen.getByTestId("radar-quadrant-top-left"))
expect(screen.getByTestId("radar-stage")).toHaveAttribute("data-zoom", "top-left")
await user.click(screen.getByRole("button", { name: /spot/i }))
expect(onSpotSelect).toHaveBeenCalledWith(expect.objectContaining({ spotId: 1 }))
```

```tsx
server.use(mapDetailHandler({ radar_image_link: null }))
render(<InteractiveMap mapId={1} />)
expect(await screen.findByText(/lineups/i)).toBeInTheDocument()
expect(screen.queryByTestId("radar-stage")).not.toBeInTheDocument()
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
cd tg-frontend && npm run test -- src/widgets/interactive-map src/features/map/radar-picker src/widgets/map-overview
```

Expected: FAIL because components are missing.

- [ ] **Step 3: Build radar picker**

`RadarPicker` props:

```ts
type RadarPickerProps = {
    imageUrl: string
    spots?: MapSpotModel[]
    selectedSpotId?: number
    mode: "throw" | "target"
    interactive?: boolean
    onSpotSelect?: (spot: MapSpotModel) => void
    onPointSelect?: (point: NormalizedPoint) => void
}
```

UI rules:

- image consumes maximum available viewport height;
- markers are absolute positioned by `left: ${x}%`, `top: ${y}%`;
- first tap selects quadrant, second tap selects point/spot;
- button hit targets are at least `44px`;
- no instructional in-app text explaining the feature.

- [ ] **Step 4: Build browsing widget**

`InteractiveMap`:

- loads map detail and spots via React Query;
- mode toggle `Throw` / `Target`;
- applies current filters to spots API;
- bottom sheet consumes each spot's `representativeLineups` from the public spots response and groups by target when mode is throw and by throw when mode is target;
- does not fetch representative cards through a separate unfiltered lineup query;
- keeps existing `GrenadesListComponent` fallback below/for no radar.

- [ ] **Step 5: Run component tests**

Run:

```bash
cd tg-frontend && npm run test -- src/widgets/interactive-map src/features/map/radar-picker src/widgets/map-overview
```

Expected: PASS.

- [ ] **Step 6: Run visual smoke check**

Run:

```bash
cd tg-frontend && npm run type-check && npm run build
```

Expected: PASS, with radar components included in production bundle.

- [ ] **Step 7: Commit**

```bash
git add tg-frontend/src/features/map/radar-picker tg-frontend/src/widgets/interactive-map tg-frontend/src/widgets/map-overview
git add tg-frontend/package.json tg-frontend/package-lock.json
git commit -m "feat: add interactive lineup map browsing"
```

---

### Task 7: tg-frontend Create/Edit Point Placement

**Files:**
- Modify: `tg-frontend/src/features/grenade/add-grenade/model.ts`
- Modify: `tg-frontend/src/features/grenade/add-grenade/ui/add-lineup-form.tsx`
- Modify: `tg-frontend/src/features/grenade/add-grenade/api.ts`
- Modify: `tg-frontend/src/pages/add-lineup-page/add-lineup-page.tsx`
- Modify if not already done in Task 6: `tg-frontend/package.json`
- Modify if not already done in Task 6: `tg-frontend/package-lock.json` or the active npm lockfile if present
- Test: `tg-frontend/src/features/grenade/add-grenade/ui/add-lineup-form.test.tsx`
- Test: `tg-frontend/src/features/grenade/add-grenade/model.test.ts`

- [ ] **Step 1: Write failing form tests**

Reuse the component-test dependencies from Task 6. If Task 7 is executed independently, first run:

```bash
cd tg-frontend && npm install --save-dev @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

Tests:

```tsx
await user.click(screen.getByRole("button", { name: /add lineup/i }))
expect(addLineup).not.toHaveBeenCalled()
expect(await screen.findByText(/set throw position/i)).toBeInTheDocument()
```

```ts
const body = convertToApiLineup(validLineupWithPoints, 7)
expect(body.get("throw_x")).toBe("11.5")
expect(body.get("throw_y")).toBe("22.5")
expect(body.get("aim_x")).toBe("33")
expect(body.get("aim_y")).toBe("44")
expect(body.get("target_x")).toBe("51")
expect(body.get("target_y")).toBe("62")
```

```ts
const body = convertToApiLineup({ ...validLineupWithPoints, throwSpotName: "", targetSpotName: "" }, 7)
expect(body.has("throw_spot_name")).toBe(false)
expect(body.has("target_spot_name")).toBe(false)
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
cd tg-frontend && npm run test -- src/features/grenade/add-grenade
```

Expected: FAIL because the form does not collect map points.

- [ ] **Step 3: Extend schema and FormData conversion**

`LineupFormData` must include:

```ts
throwPosition: NormalizedPoint
aimPosition: NormalizedPoint
targetPosition: NormalizedPoint
throwSpotName?: string
targetSpotName?: string
```

`convertToApiLineup` must append:

```ts
formData.append("throw_x", String(data.throwPosition.x))
formData.append("throw_y", String(data.throwPosition.y))
formData.append("aim_x", String(data.aimPosition.x))
formData.append("aim_y", String(data.aimPosition.y))
formData.append("target_x", String(data.targetPosition.x))
formData.append("target_y", String(data.targetPosition.y))
if (data.throwSpotName) formData.append("throw_spot_name", data.throwSpotName)
if (data.targetSpotName) formData.append("target_spot_name", data.targetSpotName)
```

- [ ] **Step 4: Add Set Map Points step**

Use `RadarPicker` three times or one picker with placement mode:

- throw point;
- aim point;
- target point.

Map must occupy the available viewport width and height on mobile; store global normalized coordinates.

- [ ] **Step 5: Run form tests and type-check**

Run:

```bash
cd tg-frontend && npm run test -- src/features/grenade/add-grenade && npm run type-check
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tg-frontend/src/features/grenade/add-grenade tg-frontend/src/pages/add-lineup-page
git add tg-frontend/package.json tg-frontend/package-lock.json
git commit -m "feat: require lineup map points"
```

---

### Task 8: admin-frontend API And Map Radar Management

**Files:**
- Modify: `admin-frontend/src/api.ts`
- Modify: `admin-frontend/src/catalog.ts`
- Modify: `admin-frontend/src/features/content-catalog/ContentPanels.tsx`
- Modify: `admin-frontend/src/styles.css`
- Test: `admin-frontend/src/api.test.ts`
- Test: `admin-frontend/src/catalog.test.ts`

- [ ] **Step 1: Write failing API tests**

Add tests:

```ts
import { afterEach, expect, it, vi } from "vitest"
import { api, createMap, updateMap, fetchMapSpots, approveMapSpot, fetchUnplacedLineups } from "./api"

afterEach(() => vi.restoreAllMocks())

it("sends radar uploads through exported map clients", async () => {
    const radarFile = new File(["png"], "de_mirage.png", { type: "image/png" })
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: { map_id: 1, name: "Mirage" } })
    const patch = vi.spyOn(api, "patch").mockResolvedValue({ data: { map_id: 1, name: "Mirage" } })

    await createMap("jwt", { name: "Mirage", is_esports_pool: false, radar_image_link: radarFile })
    const createBody = post.mock.calls[0][1] as FormData
    expect(post.mock.calls[0][0]).toBe("/admin/maps")
    expect(createBody.get("name")).toBe("Mirage")
    expect(createBody.get("is_esports_pool")).toBe("false")
    expect(createBody.get("radar_image_link")).toBe(radarFile)

    await updateMap("jwt", 1, { radar_image_link: radarFile })
    const updateBody = patch.mock.calls[0][1] as FormData
    expect(patch.mock.calls[0][0]).toBe("/admin/maps/1")
    expect(updateBody.get("radar_image_link")).toBe(radarFile)
})
```

```ts
it("passes map spot filters and action URLs through exported clients", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: [] })
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: { spot_id: 10 } })

    await fetchMapSpots("jwt", { mapID: 1, kind: "throw", status: "pending", query: "door" })
    expect(get).toHaveBeenCalledWith("/admin/map-spots", expect.objectContaining({ params: { map_id: "1", kind: "throw", status: "pending", query: "door" } }))
    await approveMapSpot("jwt", 10)
    expect(post.mock.calls[0][0]).toBe("/admin/map-spots/10/approve")
})
```

```ts
it("loads the unplaced queue through the exported client", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: [{ grenade_id: 42 }] })

    const rows = await fetchUnplacedLineups("jwt")
    expect(rows[0].grenade_id).toBe(42)
    expect(get.mock.calls[0][0]).toBe("/admin/lineups/unplaced")
})
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
cd admin-frontend && npm run test -- src/api.test.ts src/catalog.test.ts
```

Expected: FAIL because radar/map spot clients are missing.

- [ ] **Step 3: Extend admin API types and clients**

Add:

```ts
export type AdminMapSpot = {
    spot_id: number
    map_id: number
    kind: "throw" | "target"
    x: number
    y: number
    radius: number
    status: "pending" | "approved" | "rejected" | "merged"
    name: string | null
    suggested_name: string | null
    merged_into_spot_id: number | null
}

export async function fetchMapSpots(token: string, filters: MapSpotFilters = {}): Promise<AdminMapSpot[]> {
    const response = await api.get<AdminMapSpot[]>("/admin/map-spots", { ...authConfig(token), params: mapSpotParams(filters) })
    return response.data
}

export async function updateMapSpot(token: string, id: number, input: MapSpotInput): Promise<AdminMapSpot> {
    const response = await api.patch<AdminMapSpot>(`/admin/map-spots/${id}`, input, authConfig(token))
    return response.data
}

export async function approveMapSpot(token: string, id: number): Promise<AdminMapSpot> {
    const response = await api.post<AdminMapSpot>(`/admin/map-spots/${id}/approve`, undefined, authConfig(token))
    return response.data
}

export async function rejectMapSpot(token: string, id: number): Promise<AdminMapSpot> {
    const response = await api.post<AdminMapSpot>(`/admin/map-spots/${id}/reject`, undefined, authConfig(token))
    return response.data
}

export async function mergeMapSpot(token: string, id: number, targetSpotID: number): Promise<AdminMapSpot> {
    const response = await api.post<AdminMapSpot>(`/admin/map-spots/${id}/merge`, { target_spot_id: targetSpotID }, authConfig(token))
    return response.data
}

export async function fetchUnplacedLineups(token: string): Promise<AdminLineup[]> {
    const response = await api.get<AdminLineup[]>("/admin/lineups/unplaced", authConfig(token))
    return response.data
}

function mapSpotParams(filters: MapSpotFilters): Record<string, string> {
    const params: Record<string, string> = {}
    if (filters.mapID !== undefined) params.map_id = String(filters.mapID)
    if (filters.kind) params.kind = filters.kind
    if (filters.status) params.status = filters.status
    if (filters.query) params.query = filters.query
    return params
}
```

Extend `AdminMap` with radar fields and `MapInput` with `radar_image_link?: File`.

- [ ] **Step 4: Add map radar controls**

In `ContentPanels.tsx`, map table columns:

- Active pool;
- Radar present;
- Approved spot count;
- Pending spot count.

Map form:

- checkbox labelled `Active pool`;
- radar upload field;
- radar metadata display.

- [ ] **Step 5: Run admin API tests**

Run:

```bash
cd admin-frontend && npm run test -- src/api.test.ts src/catalog.test.ts && npm run type-check
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add admin-frontend/src/api.ts admin-frontend/src/catalog.ts admin-frontend/src/features/content-catalog admin-frontend/src/styles.css admin-frontend/src/*.test.ts
git commit -m "feat: add admin radar map contracts"
```

---

### Task 9: admin-frontend Map Spot Moderation And Unplaced Queue

**Files:**
- Modify: `admin-frontend/src/hooks/useAdminData.ts`
- Modify: `admin-frontend/src/features/content-catalog/types.ts`
- Modify: `admin-frontend/src/features/content-catalog/ContentPanels.tsx`
- Modify: `admin-frontend/src/lineups.ts`
- Modify: `admin-frontend/src/styles.css`
- Modify: `admin-frontend/package.json`
- Modify: `admin-frontend/package-lock.json` or the active npm lockfile if present
- Test: `admin-frontend/src/api.test.ts`
- Test: component tests added near `ContentPanels.tsx`

- [ ] **Step 1: Write failing UI tests**

First add component-test dependencies if they are not already installed:

```bash
cd admin-frontend && npm install --save-dev @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

Add `test.environment = "jsdom"` to the Vite/Vitest config if the admin app config does not already provide a DOM environment for `.tsx` component tests. Also load `@testing-library/jest-dom/vitest` through a Vitest setup file or import it in each component test that uses DOM matchers such as `toBeInTheDocument`.

Tests:

```tsx
render(<CatalogPanel mapSpots={pendingSpots} canManage />)
expect(screen.getByLabelText("Map")).toBeInTheDocument()
expect(screen.getByLabelText("Kind")).toHaveValue("throw")
expect(screen.getByRole("button", { name: "Approve" })).toBeEnabled()
expect(screen.getByRole("button", { name: "Merge" })).toBeEnabled()
```

```tsx
render(<CatalogPanel unplacedLineups={unplacedLineups} canManage />)
await user.click(screen.getByRole("button", { name: /place points for #42/i }))
expect(screen.getByText("Lineup #42")).toBeInTheDocument()
expect(screen.getByTestId("admin-radar-placement")).toBeInTheDocument()
```

```tsx
server.use(approvePullRequestConflict("spot_review_required"))
await user.click(screen.getByRole("button", { name: "Approve request" }))
expect(await screen.findByText(/spot_review_required/i)).toBeInTheDocument()
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
cd admin-frontend && npm run test -- src/features/content-catalog src/hooks src/api.test.ts
```

Expected: FAIL because spot moderation UI is missing.

- [ ] **Step 3: Load spots and unplaced queue**

Update `useAdminData` state:

```ts
const [mapSpots, setMapSpots] = useState<AdminMapSpot[]>([])
const [unplacedLineups, setUnplacedLineups] = useState<AdminLineup[]>([])
const [mapSpotFilters, setMapSpotFilters] = useState<MapSpotFiltersState>({ mapID: "", kind: "throw", status: "pending", query: "" })
```

Load `fetchMapSpots` and `fetchUnplacedLineups` when `canManageContent(me)` is true.

- [ ] **Step 4: Add map spots section**

Add a dedicated section in `ContentPanels.tsx`:

- filter by map/kind/status/search;
- mini-radar preview using `radar_image_link`;
- edit name/suggested name/x/y/radius/status;
- approve/reject buttons;
- merge target selector filtered to same map/kind.

- [ ] **Step 5: Add unplaced queue section**

Queue row fields:

- lineup id/title/map id/request status;
- missing fields indicators: throw, target, aim;
- action opens existing lineup form with spatial fields and radar picker preview.

- [ ] **Step 6: Run admin tests and build**

Run:

```bash
cd admin-frontend && npm run test && npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add admin-frontend/src/hooks admin-frontend/src/features/content-catalog admin-frontend/src/lineups.ts admin-frontend/src/styles.css admin-frontend/src/*.test.ts
git add admin-frontend/package.json admin-frontend/package-lock.json
git commit -m "feat: add admin map spot moderation"
```

---

### Task 10: Radar Asset Verification, Full Verification, And Manual QA

**Files:**
- Verify existing Task 1 assets: `backend/assets/radars/de_ancient.png`, `de_anubis.png`, `de_cache.png`, `de_dust2.png`, `de_inferno.png`, `de_mirage.png`, `de_nuke.png`, `de_overpass.png`
- Modify only if needed: tests that assert asset presence or integration wiring.

- [ ] **Step 1: Re-verify radar PNG provenance and presence**

Radar PNGs must already have been delivered by Task 1 before backend/admin/tg browsing work ships. Confirm the source recorded in the spec and migration seed is still `MurkyYT/cs2-map-icons`, and confirm the files remain exactly under `backend/assets/radars/` with the names listed above.

Expected provenance in migration seed:

```text
MurkyYT/cs2-map-icons, local copy
```

- [ ] **Step 2: Verify assets are real PNGs**

Run:

```bash
test -f backend/assets/radars/de_ancient.png
test -f backend/assets/radars/de_anubis.png
test -f backend/assets/radars/de_cache.png
test -f backend/assets/radars/de_dust2.png
test -f backend/assets/radars/de_inferno.png
test -f backend/assets/radars/de_mirage.png
test -f backend/assets/radars/de_nuke.png
test -f backend/assets/radars/de_overpass.png
file backend/assets/radars/de_*.png
```

Expected: every line contains `PNG image data`.

- [ ] **Step 3: Run full backend checks**

Run:

```bash
cd backend && go test ./...
python3 -m unittest discover -s backend/tests
```

Expected: PASS.

- [ ] **Step 4: Run full tg-frontend checks**

Run:

```bash
cd tg-frontend && npm run test && npm run type-check && npm run build
```

Expected: PASS.

- [ ] **Step 5: Run full admin-frontend checks**

Run:

```bash
cd admin-frontend && npm run test && npm run build
```

Expected: PASS.

- [ ] **Step 6: Manual QA**

Run local stack:

```bash
docker compose up -d --build
```

Manual checks:

- open tg frontend map detail on mobile viewport;
- verify radar image renders and occupies most of the screen;
- tap a quadrant, then a spot, then verify bottom sheet opens;
- switch `Throw`/`Target` and verify marker kind changes;
- create a lineup and submit throw, aim, and target fields;
- approve or merge pending spots in admin;
- verify approved markers appear and legacy unplaced lineups remain visible in normal list but absent from map markers.

- [ ] **Step 7: Commit final verification adjustments if any**

```bash
git add backend/tests tg-frontend admin-frontend
git commit -m "test: verify interactive map integration"
```

If Task 10 only runs checks and manual QA without changing files, do not create an empty commit.

---

## Beads Decomposition

Create implementation issues from these plan tasks before coding:

- `Interactive map backend schema and sqlc`
- `Interactive map backend spot normalization`
- `Interactive map backend public API`
- `Interactive map backend admin moderation`
- `Interactive map tg contracts`
- `Interactive map tg browsing`
- `Interactive map tg create/edit placement`
- `Interactive map admin contracts and map radar controls`
- `Interactive map admin spot moderation`
- `Interactive map full QA and asset verification`

Dependencies:

- Task 2 depends on Task 1.
- Task 3 depends on Task 2.
- Task 4 depends on Task 3.
- Task 5 depends on Task 3.
- Task 6 depends on Task 5.
- Task 7 depends on Task 5 and Task 6.
- Task 8 depends on Task 3.
- Task 9 depends on Task 4 and Task 8.
- Task 10 depends on Tasks 1, 3, 6, 7, and 9.

## Self-Review

Spec coverage:

- Backend data model: Tasks 1 and 2.
- Spot normalization: Task 2.
- Public API and radar serving: Task 3.
- Admin API and moderation coupling: Task 4.
- tg-frontend browsing UX: Task 6.
- tg-frontend create/edit placement: Task 7.
- Admin frontend UX: Tasks 8 and 9.
- Assets and seed data: Task 1 delivers seed data and PNGs; Task 10 re-verifies them during full QA.
- Backward compatibility and error handling: Tasks 1 through 4 plus verification in Task 10.
- Rollout order: task order follows schema/backend, seed/assets, admin, tg browsing, tg creation, old-data enrichment.

Placeholder scan:

- No unresolved placeholder markers or vague future-work wording are intentional plan content.
- Every task has files, failing tests, run command, implementation scope, passing check, and commit command.

Type consistency:

- Backend uses `mapspots.Spot`, `mapspots.SpotDTO`, `mapspots.Coordinate`, and `mapspots.CoordinateDTO`.
- Frontend uses `MapSpotModel`, `NormalizedPoint`, and `Quadrant`.
- API field names stay snake_case in DTO/FormData and camelCase in TypeScript models.
