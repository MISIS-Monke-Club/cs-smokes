# Interactive 2D Lineup Map Design

Date: 2026-06-30
Status: Draft for user review
Beads issue: `cs-smokes-4zu`

## Goal

Build a complete interactive 2D CS2 radar map feature for browsing, creating, and moderating lineups by spatial spots.

Users must be able to open a map, see grouped lineup positions on the radar, switch between throw spots and target spots, zoom into a quadrant on mobile, and open a bottom sheet with lineups for the selected spot. Creators and admins must be able to assign precise throw, aim, and target positions to lineups. The backend must normalize nearby clicks into canonical spots so several users clicking roughly the same real-world position, such as the Mirage T spawn door, produce one service-level spot with multiple lineups.

## Current Context

- `maps` already has `is_esports_pool`, `image_path`, list/detail endpoints, admin CRUD, and frontend filters.
- `lineups` currently belongs to a map and has video/title/description/preview metadata, but no spatial coordinates.
- Public map detail returns `map_lineups`, and tg-frontend has `/maps/:mapId/grenades`.
- Admin frontend already manages maps and lineups.
- Existing lineups have no coordinates and must remain valid.
- Existing lineup filters do not yet cover every map-marker use case. Implementation must add `grenade_class_id` filtering to lineup list/search before relying on that filter in spot marker counts.

## Product Decisions

1. Active pool is a single product flag, not separate Premier/FACEIT flags.
   - Use existing `is_esports_pool` as the active-pool flag.
   - Admin UI copy must call it "Active pool" to avoid overfitting to esports wording.

2. Seed the active pool as the union of current/relevant Premier and FACEIT maps as of 2026-06-30:
   - Ancient
   - Anubis
   - Dust II
   - Inferno
   - Mirage
   - Nuke
   - Overpass
   - Cache

3. The seed intentionally includes both Overpass and Cache.
   - Overpass remains relevant before the Premier Season Five switch on 2026-07-06.
   - Cache is already entering FACEIT Season 8 and is announced for the next Premier active pool.
   - This choice follows the product decision that `is_esports_pool` is a unified active-pool flag.

4. The feature is not an MVP. It must include throw, aim, and target positions, spot moderation, merge tooling, local radar assets, and backward-compatible handling of existing lineups.

## External Source Notes

These sources are used only to justify seed data and asset provenance. Runtime must not depend on external image hosts.

- Radar assets and overview data: [`MurkyYT/cs2-map-icons`](https://github.com/MurkyYT/cs2-map-icons) describes automatically updated CS2 map icons, radar overheads, thumbnails, and overview/radar config data scraped from the official game depot.
- FACEIT Season 8: FACEIT's [Season 8 Map Vote FAQ](https://support.faceit.com/hc/en-us/articles/26458064591644-FACEIT-Season-8-Map-Vote-FAQ) states that a community-voted map enters the matchmaking pool when Season 8 launches on 2026-04-22. [FACEIT Season 8](https://www.faceit.com/season8) and [Dust2.us](https://www.dust2.us/news/72972/faceit-to-add-cache-to-map-pool-in-season-8-update) report Cache as the selected map.
- Premier transition: third-party reports state that Cache replaces Overpass after the current Premier season ends on 2026-07-06; use this as seed rationale, not as a runtime dependency.
- CS2 active-duty context: [Liquipedia's CS2 map portal](https://liquipedia.net/counterstrike/Portal%3AMaps/CS2) and the [Counter-Strike Wiki Active Duty page](https://counterstrike.fandom.com/wiki/Category%3AActive_Duty_Group) list Ancient, Anubis, Dust II, Inferno, Mirage, Nuke, and Overpass at the time of review.

## Backend Data Model

### `maps` Changes

Add radar-specific fields instead of reusing the existing card image:

- `radar_image_path text`
- `radar_source text`
- `radar_width integer`
- `radar_height integer`

Rationale:

- `image_path` can remain a visual card/thumbnail image.
- `radar_image_path` is the image used for precise coordinate placement.
- `radar_source` preserves provenance for locally stored assets.
- Coordinates are normalized to the displayed radar and do not require game-world coordinate conversion for this feature.

### New `map_spots` Table

Create canonical spots that lineups attach to.

Fields:

- `spot_id integer primary key`
- `map_id integer not null references maps(map_id) on delete cascade`
- `kind text not null check (kind in ('throw', 'target'))`
- `x numeric(6,3) not null check (x >= 0 and x <= 100)`
- `y numeric(6,3) not null check (y >= 0 and y <= 100)`
- `radius numeric(6,3) not null default 3.0 check (radius > 0 and radius <= 25)`
- `status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'merged'))`
- `name text`
- `suggested_name text`
- `created_by integer references users(user_id) on delete set null`
- `approved_by integer references users(user_id) on delete set null`
- `merged_into_spot_id integer references map_spots(spot_id) on delete set null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:

- `(map_id, kind, status)`
- `(map_id, kind, x, y)`
- `(merged_into_spot_id)` where not null

Rules:

- `throw` and `target` spots are separate namespaces.
- Merge is only allowed when both spots have the same `map_id` and `kind`.
- Rejected and merged spots are not public.
- Approved spots can be reused by normal user lineup creation.
- A lineup with pending throw or target spots must not appear on the public interactive map until both spots are approved or merged into approved spots.

### `lineups` Changes

Add nullable spatial references:

- `throw_spot_id integer references map_spots(spot_id) on delete set null`
- `target_spot_id integer references map_spots(spot_id) on delete set null`
- `aim_x numeric(6,3) check (aim_x >= 0 and aim_x <= 100)`
- `aim_y numeric(6,3) check (aim_y >= 0 and aim_y <= 100)`

Rules:

- Existing lineups remain valid with all new fields null.
- Public map markers include only lineups that have the relevant approved spot and are approved.
- `aim_x/aim_y` are per-lineup exact coordinates and are not clustered.

## Spot Normalization

When creating or updating a lineup with spatial fields:

1. Validate all supplied coordinates are numeric values from 0 to 100.
2. For `throw` and `target` coordinates, search `map_spots` for the nearest non-rejected spot with the same `map_id` and `kind`.
3. A spot matches when the click lies within that spot's radius.
4. If multiple spots match, choose the nearest by Euclidean distance in normalized coordinate space.
5. If no spot matches, create a new `pending` spot with the submitted coordinate, default radius, created user, and optional suggested name.
6. Attach the lineup to the matched or newly created spot.
7. Store `aim_x/aim_y` directly on the lineup.

Initial default radius:

- Use `3.0` normalized units for both throw and target spots.
- Admin can edit per-spot radius after observing real usage.

## Public API Design

### Map DTO

Add:

- `radar_image_link: string | null`
- `radar_source: string | null`
- `radar_width: number | null`
- `radar_height: number | null`

### Lineup DTO

Add:

- `throw_spot: MapSpotDTO | null`
- `target_spot: MapSpotDTO | null`
- `aim_position: CoordinateDTO | null`

`MapSpotDTO`:

- `spot_id`
- `map_id`
- `kind`
- `name`
- `x`
- `y`
- `radius`
- `lineup_count` when returned from spot list endpoints

`CoordinateDTO`:

- `x`
- `y`

### Create/Patch Lineup Inputs

Existing multipart endpoints accept these optional fields:

- `throw_x`
- `throw_y`
- `throw_spot_name`
- `target_x`
- `target_y`
- `target_spot_name`
- `aim_x`
- `aim_y`

Validation:

- `throw_x` and `throw_y` must be supplied together.
- `target_x` and `target_y` must be supplied together.
- `aim_x` and `aim_y` must be supplied together.
- Partial coordinate pairs return field errors.
- Coordinates outside 0..100 return field errors.

### Public Spots Endpoint

Add:

`GET /api/maps/{id}/spots`

Query params:

- `kind=throw|target` required or default `throw`
- `grenade_class_id`
- `is_approved`
- `query`
- `by_user_name`
- `ordering`

Response:

- approved spots only
- each spot includes count and representative lineups matching filters
- spots with zero matching approved lineups are omitted

The spot endpoint and existing lineup list must agree: if filters exclude a lineup from the list, it must not contribute to marker counts.

## Admin API Design

Add admin endpoints:

- `GET /api/admin/map-spots`
- `GET /api/admin/map-spots/{id}`
- `PATCH /api/admin/map-spots/{id}`
- `POST /api/admin/map-spots/{id}/approve`
- `POST /api/admin/map-spots/{id}/reject`
- `POST /api/admin/map-spots/{id}/merge`
- `GET /api/admin/lineups/unplaced`

Admin list filters:

- `map_id`
- `kind`
- `status`
- `query` over `name` and `suggested_name`

Merge input:

- `target_spot_id`

Merge behavior:

1. Validate source and target have same `map_id` and `kind`.
2. Reassign all lineups from source spot to target spot.
3. Mark source spot as `merged`.
4. Set `merged_into_spot_id`.
5. Source spot is no longer public.

Permissions:

- Editors/base admins/superusers may place points for lineups and edit pending spot metadata.
- Base admins/superusers may approve, reject, and merge spots.

Moderation coupling:

- Pull request approval for a lineup with new pending throw or target spots must include spot review in the same admin workflow.
- The reviewer must either approve each pending spot, merge it into an approved spot, or reject/adjust it before the lineup becomes visible on the public map.
- Existing pull request status approval must not silently publish unreviewed spots.

## tg-Frontend UX

### Browsing

Use the `B` layout selected in brainstorming:

- Radar-first mobile layout.
- Radar takes maximum available vertical space.
- Toggle between `Throw` and `Target`.
- Default mode is `Throw`.
- The first tap selects one of four fixed quadrants and zooms into it.
- The second tap selects a spot within the zoomed quadrant.
- Selected spot opens a bottom sheet with:
  - spot name or fallback label
  - lineup count
  - target grouping when in throw mode
  - throw grouping when in target mode
  - lineup cards matching current filters

### Filters

Markers respect the same filters as the current lineup list.

Examples:

- If Smoke is selected, only spots with matching smoke lineups contribute to marker counts.
- If the user searches lineups, marker counts reflect search results.
- Switching `Throw/Target` changes marker kind, not the underlying filter set.

### Create/Edit Lineup

Add a `Set map points` step:

1. Select throw position.
2. Optionally type suggested throw spot name.
3. Select aim position.
4. Select target position.
5. Optionally type suggested target spot name.

UX rules:

- The create/edit form uses the same quadrant zoom interaction.
- Point placement stores global normalized coordinates, not quadrant-relative coordinates.
- New lineup creation in tg-frontend must require throw, aim, and target positions.
- Backend create keeps the coordinate fields technically optional for backward compatibility, but the tg-frontend create flow must always submit them.
- Backend patch preserves existing spatial fields when omitted.

## Admin Frontend UX

### Maps Management

Extend the existing map editor:

- Active pool checkbox, backed by `is_esports_pool`.
- Radar image upload and preview.
- Radar metadata display.
- Table columns for active pool, radar present, approved spot count, and pending spot count.

### Map Spots Management

Add a dedicated admin section:

- Filter by map, kind, status, and search.
- Show spot rows with mini-radar preview.
- Spot detail form edits name, suggested name, coordinates, radius, and status.
- Approve/reject actions.
- Merge action selecting another spot from the same map and kind.

### Unplaced Lineups Queue

Add an admin queue:

- Shows approved or pending lineups missing `throw_spot_id` or `target_spot_id`.
- Admin can open a lineup and assign throw, aim, and target points.
- After saving and approving spots, the lineup appears on public map markers.

## Assets And Seed Data

Radar PNGs for the 8 active-pool maps must be stored locally at `backend/assets/radars/` with one PNG per map slug:

- `backend/assets/radars/de_ancient.png`
- `backend/assets/radars/de_anubis.png`
- `backend/assets/radars/de_cache.png`
- `backend/assets/radars/de_dust2.png`
- `backend/assets/radars/de_inferno.png`
- `backend/assets/radars/de_mirage.png`
- `backend/assets/radars/de_nuke.png`
- `backend/assets/radars/de_overpass.png`

Migration/seed behavior:

- Add radar fields.
- Upsert the 8 maps by stable slug/name without changing existing `map_id` values.
- Set `is_esports_pool=true` for the 8 active-pool maps.
- Set radar metadata and local radar path.
- Do not automatically set all other maps to inactive unless a later explicit product decision requests that cleanup.

## Backward Compatibility

- Existing lineups stay valid because all spatial fields are nullable.
- Existing map APIs remain compatible; new DTO fields are additive.
- Existing frontend list views continue to work.
- Public interactive map may be empty for older maps until lineups are enriched.
- Admin unplaced queue is the migration path for old data.

## Error Handling

- Invalid coordinate numbers return `400` with field-specific errors.
- Partial coordinate pairs return `400`.
- Missing radar asset for a map returns `200` for map detail/list with `radar_image_link: null`.
- Public spot endpoints return empty arrays when no spots match.
- Merge of different maps/kinds returns `400`.
- Merge/reject/approve of missing spot returns `404`.
- Unauthorized admin spot actions return `401` or `403` according to existing admin auth behavior.

## Verification Requirements

Backend:

- Migration/schema tests for new columns, constraints, and FKs.
- Repository tests for nearest spot lookup, tie handling, new pending spot creation, and merge reassignment.
- Handler tests for lineup create/patch with throw, aim, target fields.
- Handler tests that public spots exclude pending/rejected/merged spots.
- Handler tests that public spots respect lineup filters.
- Admin tests for approve, reject, merge, and unplaced queue.
- OpenAPI/schema tests for new DTO fields and endpoints.

tg-frontend:

- Zod DTO tests for `radar_image_link`, `throw_spot`, `target_spot`, and `aim_position`.
- Unit tests for converting viewport click coordinates to normalized 0..100 coordinates.
- Unit tests for quadrant selection and global coordinate conversion.
- Component tests for bottom sheet spot grouping.
- Create/edit form tests for emitted multipart fields.

admin-frontend:

- API client tests for map spot endpoints and unplaced queue.
- FormData tests for radar image upload.
- Component tests for spot approve/reject/merge controls.

Manual QA:

- On mobile viewport, user can tap a quadrant, select a spot, and open lineups without tiny hit targets.
- On mobile viewport, user can place throw, aim, and target points for a new lineup.
- Admin can merge two nearby spots and see marker count update.
- Existing lineup without coordinates remains visible in normal list and absent from map markers.

## Rollout

1. Ship schema and backend support first, with nullable fields.
2. Seed radar assets and active-pool maps.
3. Ship admin spot tooling and unplaced queue.
4. Ship tg-frontend browsing map.
5. Ship tg-frontend create/edit point placement.
6. Gradually enrich old lineups through admin queue.

At every step, existing list-based browsing must keep working.

## Non-Goals For First Implementation Plan

- No separate Premier/FACEIT pool flags.
- No split UI for incorrectly merged spots.
- No arbitrary bounce/path editor.
- No game-world coordinate conversion based on Valve overview `pos_x/pos_y/scale`.
- No runtime dependency on external radar image URLs.
