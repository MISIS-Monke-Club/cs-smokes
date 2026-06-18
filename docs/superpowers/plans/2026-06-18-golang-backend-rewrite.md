# Golang Backend Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Django/DRF backend with a Go drop-in replacement, add a separate React admin app, preserve the existing `tg-frontend` public API contract, and provide a rehearsable data migration and rollback path.

**Architecture:** Build a modular Go monolith in `backend/` with `chi`, `pgx/sqlc`, `golang-migrate`, `go-redis`, and `nhooyr.io/websocket`. Public routes use a compatibility layer that preserves current `tg-frontend` paths and DTOs; admin routes live under `/api/admin/*` with stricter role checks. A separate `admin-frontend/` Vite app talks to admin APIs and never mixes with `tg-frontend`.

**Tech Stack:** Go 1.23+, chi, pgx, sqlc, golang-migrate, go-redis, nhooyr.io/websocket, PostgreSQL 15, Redis, React 18, Vite, TypeScript, TanStack Query, Axios, Zod, Docker Compose, nginx.

---

## Approved Inputs

- Spec: `docs/superpowers/specs/2026-06-18-golang-backend-rewrite-design.md`
- Branch: `feature/ai/golang-backend`
- Public API compatibility is mandatory for `tg-frontend`.
- The only allowed `tg-frontend` change is the WebSocket token/base-URL adapter.
- Existing production integer IDs are preserved exactly during migration.
- Production cutover uses a write freeze/read-only gate until post-cutover smoke and golden checks pass.
- WebSocket auth uses `?token=<access_token>` for first release, with required token redaction in every log/telemetry sink.

## File Structure

Create or replace these backend files:

- `backend/go.mod`: Go module definition.
- `backend/go.sum`: Go dependency locks.
- `backend/cmd/server/main.go`: server entrypoint.
- `backend/internal/config/config.go`: typed environment config.
- `backend/internal/platform/logger/logger.go`: structured logger and token redaction helpers.
- `backend/internal/platform/httpserver/server.go`: HTTP server construction and graceful shutdown.
- `backend/internal/platform/httpx/errors.go`: public/admin error writers.
- `backend/internal/platform/httpx/middleware.go`: request id, recovery, CORS, auth, write gate, redaction.
- `backend/internal/platform/postgres/postgres.go`: pgx pool setup.
- `backend/internal/platform/redis/redis.go`: Redis client setup.
- `backend/internal/db/query.sql`: sqlc queries.
- `backend/internal/db/models.go`: small hand-written domain aliases when sqlc output needs wrappers.
- `backend/internal/db/generated/`: sqlc generated package.
- `backend/internal/auth/*.go`: Telegram auth, password hash verification, JWT.
- `backend/internal/users/*.go`: users and roles.
- `backend/internal/grenadeclasses/*.go`: grenade classes.
- `backend/internal/maps/*.go`: maps and map detail.
- `backend/internal/lineups/*.go`: lineups, filters, derived fields.
- `backend/internal/properties/*.go`: properties and lineup-property links.
- `backend/internal/favorites/*.go`: favorites.
- `backend/internal/pullrequests/*.go`: pull requests and REST comments.
- `backend/internal/realtime/*.go`: WebSocket comments.
- `backend/internal/media/*.go`: upload validation, storage, URL generation.
- `backend/internal/admin/*.go`: admin routes and role matrix.
- `backend/internal/openapi/openapi.go`: OpenAPI JSON serving endpoint.
- `backend/migrations/*.sql`: golang-migrate up/down migrations.
- `backend/sqlc.yaml`: sqlc configuration.
- `backend/dockerfile.dev`: Go dev image.
- `backend/dockerfile.prod`: Go production image.
- `backend/run-server.sh`: Go dev startup.
- `backend/run-server.prod.sh`: Go production startup.
- `backend/tests/contract/*.go`: Go contract fixture runner.
- `backend/tools/migrate-django/*.go`: production migration tool.
- `backend/tools/logscan/*.go`: sentinel token log scanner.

Create these admin frontend files:

- `admin-frontend/package.json`: scripts and dependencies.
- `admin-frontend/vite.config.ts`: Vite config.
- `admin-frontend/tsconfig.json`: TypeScript config.
- `admin-frontend/index.html`: app root.
- `admin-frontend/dockerfile.dev`: dev Docker image.
- `admin-frontend/dockerfile.prod`: production build image or static export support.
- `admin-frontend/src/app/main.tsx`: React entry.
- `admin-frontend/src/app/router.tsx`: routes.
- `admin-frontend/src/app/providers.tsx`: query and auth providers.
- `admin-frontend/src/shared/api/client.ts`: Axios client.
- `admin-frontend/src/shared/auth/session.ts`: token storage in memory plus `sessionStorage`.
- `admin-frontend/src/entities/*`: DTO schemas and API clients.
- `admin-frontend/src/pages/*`: login, moderation queue, PR detail, CRUD pages.
- `admin-frontend/src/widgets/*`: navigation, tables, forms, modals.
- `admin-frontend/src/app/styles.css`: application styles.

Modify these shared files:

- `docker-compose.yaml`: replace Django backend command/image behavior, add `admin-frontend`.
- `docker-compose.prod.yaml`: replace Django backend, add admin static serving/build, preserve db/redis/bot.
- `nginx/nginx.conf`: route `/api/*`, `/ws/api/*`, `/media/*`, `/admin/*`; redact `token` in logs.
- `.env.example`: replace Django-specific names with Go names while keeping compatibility aliases where compose still needs them.
- `README.md`: updated local run instructions.
- `backend/README.md`: Go backend setup, migrations, tests.
- `admin-frontend/README.md`: admin setup and security notes.
- `tg-frontend/src/widgets/request-feed/request-feed.tsx`: minimal WebSocket token/base-URL adapter only.

## Task 1: Backend Foundation

**Files:**
- Create: `backend/go.mod`
- Create: `backend/cmd/server/main.go`
- Create: `backend/internal/config/config.go`
- Create: `backend/internal/platform/httpserver/server.go`
- Create: `backend/internal/platform/httpx/errors.go`
- Create: `backend/internal/platform/httpx/middleware.go`
- Create: `backend/internal/platform/logger/logger.go`
- Create: `backend/internal/platform/postgres/postgres.go`
- Create: `backend/internal/platform/redis/redis.go`
- Modify: `backend/dockerfile.dev`
- Modify: `backend/run-server.sh`
- Test: `backend/internal/config/config_test.go`
- Test: `backend/internal/platform/httpx/middleware_test.go`

- [ ] **Step 1: Initialize Go module**

Run:

```bash
cd backend
go mod init github.com/MISIS-Monke-Club/cs-smokes/backend
go get github.com/go-chi/chi/v5 github.com/jackc/pgx/v5/pgxpool github.com/redis/go-redis/v9 github.com/golang-jwt/jwt/v5 nhooyr.io/websocket
go mod tidy
```

Expected: `backend/go.mod` and `backend/go.sum` exist.

- [ ] **Step 2: Write failing config tests**

Create `backend/internal/config/config_test.go`:

```go
package config

import "testing"

func TestLoadRequiresCoreValues(t *testing.T) {
	t.Setenv("DB_NAME", "")
	t.Setenv("SECRET_KEY", "")
	_, err := Load()
	if err == nil {
		t.Fatalf("expected Load to reject missing DB_NAME and SECRET_KEY")
	}
}

func TestLoadBuildsDatabaseURL(t *testing.T) {
	t.Setenv("DB_NAME", "database")
	t.Setenv("DB_USER", "SA_admin")
	t.Setenv("DB_PASSWORD", "12344321")
	t.Setenv("DB_HOST", "db")
	t.Setenv("DB_PORT", "5432")
	t.Setenv("SECRET_KEY", "secret")
	t.Setenv("TOKEN", "telegram-token")
	t.Setenv("REDIS_PASS", "redis-pass")
	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load returned error: %v", err)
	}
	if cfg.DatabaseURL == "" {
		t.Fatalf("DatabaseURL is empty")
	}
	if cfg.HTTPAddr != ":8000" {
		t.Fatalf("HTTPAddr = %q, want :8000", cfg.HTTPAddr)
	}
}
```

- [ ] **Step 3: Run failing config tests**

Run:

```bash
cd backend
go test ./internal/config
```

Expected: FAIL because `Load` is not defined.

- [ ] **Step 4: Implement config**

Create `backend/internal/config/config.go`:

```go
package config

import (
	"errors"
	"fmt"
	"os"
	"strings"
)

type Config struct {
	HTTPAddr       string
	BackendBaseURL string
	AllowedOrigins []string
	DatabaseURL    string
	RedisAddr      string
	RedisPassword  string
	SecretKey      string
	TelegramToken  string
	MediaRoot      string
	PublicMediaURL string
	WriteGate      bool
	WSAllowDevAnon bool
}

func Load() (Config, error) {
	dbName := getenv("DB_NAME", "")
	dbUser := getenv("DB_USER", "")
	dbPass := getenv("DB_PASSWORD", "")
	dbHost := getenv("DB_HOST", "db")
	dbPort := getenv("DB_PORT", "5432")
	secret := getenv("SECRET_KEY", "")
	if dbName == "" || dbUser == "" || secret == "" {
		return Config{}, errors.New("DB_NAME, DB_USER, and SECRET_KEY are required")
	}
	cfg := Config{
		HTTPAddr:        getenv("HTTP_ADDR", ":8000"),
		BackendBaseURL:  getenv("BACKEND_SERVER", "http://localhost:3000/api"),
		AllowedOrigins:  splitCSV(getenv("ALLOWED_ORIGINS", "http://localhost:8000,http://localhost:3000")),
		DatabaseURL:     fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable", dbUser, dbPass, dbHost, dbPort, dbName),
		RedisAddr:       getenv("REDIS_ADDR", "redis:6379"),
		RedisPassword:   getenv("REDIS_PASS", ""),
		SecretKey:       secret,
		TelegramToken:   getenv("TOKEN", ""),
		MediaRoot:       getenv("MEDIA_ROOT", "/backend/media"),
		PublicMediaURL:  getenv("PUBLIC_MEDIA_URL", "/media/"),
		WriteGate:       getenv("WRITE_GATE", "false") == "true",
		WSAllowDevAnon:  getenv("WS_ALLOW_UNAUTHENTICATED_DEV", "false") == "true",
	}
	return cfg, nil
}

func getenv(key string, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func splitCSV(value string) []string {
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}
```

- [ ] **Step 5: Add health router and server**

Create `backend/cmd/server/main.go`:

```go
package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/config"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/platform/httpserver"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("load config: %v", err)
	}
	server := httpserver.New(cfg)
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %v", err)
		}
	}()
	<-ctx.Done()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("shutdown: %v", err)
	}
}
```

Create `backend/internal/platform/httpserver/server.go`:

```go
package httpserver

import (
	"encoding/json"
	"net/http"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/config"
	"github.com/go-chi/chi/v5"
)

func New(cfg config.Config) *http.Server {
	router := chi.NewRouter()
	router.Get("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})
	router.Get("/api/health/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})
	return &http.Server{Addr: cfg.HTTPAddr, Handler: router}
}
```

- [ ] **Step 6: Run foundation tests**

Run:

```bash
cd backend
go test ./...
go run ./cmd/server
```

Expected: tests PASS; server starts on `:8000`. Stop the server with `Ctrl+C`.

- [ ] **Step 7: Replace dev Docker startup**

Replace `backend/dockerfile.dev` with a Go image that installs dependencies and runs `go run ./cmd/server`. Replace `backend/run-server.sh` with:

```sh
#!/bin/sh
set -eu
go mod download
go run ./cmd/server
```

Run:

```bash
docker compose build backend
```

Expected: backend image builds.

- [ ] **Step 8: Commit foundation**

```bash
git add backend/go.mod backend/go.sum backend/cmd backend/internal/config backend/internal/platform backend/dockerfile.dev backend/run-server.sh
git commit -m "feat: scaffold Go backend foundation"
```

## Task 2: Database Migrations And sqlc Skeleton

**Files:**
- Create: `backend/migrations/000001_initial_schema.up.sql`
- Create: `backend/migrations/000001_initial_schema.down.sql`
- Create: `backend/sqlc.yaml`
- Create: `backend/internal/db/query.sql`
- Generate: `backend/internal/db/generated/`
- Test: `backend/internal/db/schema_test.go`

- [ ] **Step 1: Write schema smoke test**

Create `backend/internal/db/schema_test.go`:

```go
package db_test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestInitialSchemaPreservesPublicIDColumns(t *testing.T) {
	path := filepath.Join("..", "..", "migrations", "000001_initial_schema.up.sql")
	contentBytes, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read migration: %v", err)
	}
	content := string(contentBytes)
	required := []string{
		"user_id integer primary key",
		"map_id integer primary key",
		"grenade_id integer primary key",
		"grenade_class_id integer primary key",
		"property_id integer primary key",
		"unique (tg_id)",
	}
	for _, text := range required {
		if !strings.Contains(strings.ToLower(content), text) {
			t.Fatalf("migration missing %q", text)
		}
	}
}
```

- [ ] **Step 2: Run failing schema test**

```bash
cd backend
go test ./internal/db
```

Expected: FAIL because migration file does not exist.

- [ ] **Step 3: Create initial migration**

Create `backend/migrations/000001_initial_schema.up.sql` with tables:

```sql
create table users (
    user_id integer primary key,
    username text not null unique,
    email text unique,
    password_hash text,
    first_name text,
    last_name text,
    avatar_url text,
    steam_link text,
    tg_id bigint unique,
    is_banned boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table admin_roles (
    role_id integer primary key,
    code text not null unique check (code in ('superuser', 'base_admin', 'editor')),
    created_at timestamptz not null default now()
);

create table user_admin_roles (
    user_id integer not null references users(user_id) on delete cascade,
    role_id integer not null references admin_roles(role_id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, role_id)
);

create table maps (
    map_id integer primary key,
    name text not null,
    link text,
    is_esports_pool boolean not null default false,
    image_path text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table grenade_classes (
    grenade_class_id integer primary key,
    name text not null,
    description text,
    price integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table lineups (
    grenade_id integer primary key,
    map_id integer not null references maps(map_id) on delete cascade,
    user_id integer not null references users(user_id) on delete cascade,
    grenade_class_id integer not null references grenade_classes(grenade_class_id) on delete restrict,
    link_to_video text,
    title text not null,
    description text,
    is_approved boolean not null default false,
    views integer not null default 0,
    preview_image_path text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table properties (
    property_id integer primary key,
    name text not null,
    value text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table lineup_properties (
    property_id integer not null references properties(property_id) on delete cascade,
    grenade_id integer not null references lineups(grenade_id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (property_id, grenade_id)
);

create table favorites (
    user_id integer not null references users(user_id) on delete cascade,
    grenade_id integer not null references lineups(grenade_id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, grenade_id)
);

create table pull_requests (
    id integer primary key,
    lineup_id integer not null references lineups(grenade_id) on delete cascade,
    creator_id integer not null references users(user_id) on delete cascade,
    approver_id integer references users(user_id) on delete set null,
    status text not null default 'OPEN' check (status in ('OPEN', 'APPROVED', 'REJECTED', 'MERGED', 'CLOSED')),
    created_at timestamptz not null default now(),
    closed_at timestamptz
);

create table comments (
    id integer primary key,
    pull_request_id integer not null references pull_requests(id) on delete cascade,
    author_id integer not null references users(user_id) on delete cascade,
    text text not null,
    created_at timestamptz not null default now()
);

create index maps_name_idx on maps (lower(name));
create index lineups_map_id_idx on lineups (map_id);
create index lineups_user_id_idx on lineups (user_id);
create index lineups_is_approved_idx on lineups (is_approved);
create index lineups_title_idx on lineups (lower(title));
create index pull_requests_lineup_id_idx on pull_requests (lineup_id);
create index pull_requests_status_idx on pull_requests (status);
create index comments_pull_request_created_idx on comments (pull_request_id, created_at);

insert into admin_roles (role_id, code) values
    (1, 'superuser'),
    (2, 'base_admin'),
    (3, 'editor');
```

Create `backend/migrations/000001_initial_schema.down.sql`:

```sql
drop table if exists comments;
drop table if exists pull_requests;
drop table if exists favorites;
drop table if exists lineup_properties;
drop table if exists properties;
drop table if exists lineups;
drop table if exists grenade_classes;
drop table if exists maps;
drop table if exists user_admin_roles;
drop table if exists admin_roles;
drop table if exists users;
```

- [ ] **Step 4: Add sqlc config and seed query file**

Create `backend/sqlc.yaml`:

```yaml
version: "2"
sql:
  - engine: "postgresql"
    schema: "migrations"
    queries: "internal/db/query.sql"
    gen:
      go:
        package: "generated"
        out: "internal/db/generated"
        sql_package: "pgx/v5"
```

Create `backend/internal/db/query.sql`:

```sql
-- name: GetHealthValue :one
select 1::int as value;
```

- [ ] **Step 5: Install and run sqlc**

```bash
cd backend
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
sqlc generate
go test ./...
```

Expected: sqlc generates `backend/internal/db/generated/`; tests PASS.

- [ ] **Step 6: Commit schema skeleton**

```bash
git add backend/migrations backend/sqlc.yaml backend/internal/db
git commit -m "feat: add Go database schema skeleton"
```

## Task 3: Auth Compatibility

**Files:**
- Create: `backend/internal/auth/password.go`
- Create: `backend/internal/auth/jwt.go`
- Create: `backend/internal/auth/telegram.go`
- Create: `backend/internal/auth/handlers.go`
- Create: `backend/internal/auth/routes.go`
- Modify: `backend/internal/platform/httpserver/server.go`
- Test: `backend/internal/auth/password_test.go`
- Test: `backend/internal/auth/telegram_test.go`
- Test: `backend/internal/auth/jwt_test.go`

- [ ] **Step 1: Write failing password compatibility tests**

Create `backend/internal/auth/password_test.go`:

```go
package auth

import "testing"

func TestVerifyDjangoPBKDF2Password(t *testing.T) {
	hash := "pbkdf2_sha256$720000$testsalt$61IgY/P6T7Qtowk/Vb2vNgc5TzaGURpWPHcfpIzPBUc="
	ok, err := VerifyPassword("password", hash)
	if err != nil {
		t.Fatalf("VerifyPassword returned error: %v", err)
	}
	if !ok {
		t.Fatalf("known-good Django PBKDF2 hash did not verify")
	}
}

func TestRejectUnknownPasswordAlgorithm(t *testing.T) {
	ok, err := VerifyPassword("password", "unknown$hash")
	if err == nil {
		t.Fatalf("expected error for unknown algorithm")
	}
	if ok {
		t.Fatalf("unknown algorithm must not verify")
	}
}
```

- [ ] **Step 2: Write Telegram hash tests**

Create `backend/internal/auth/telegram_test.go`:

```go
package auth

import "testing"

func TestTelegramSignatureRejectsMissingHash(t *testing.T) {
	if CheckTelegramWebAppSignature("token", "user=%7B%22id%22%3A1%7D") {
		t.Fatalf("missing hash must be rejected")
	}
}

func TestTelegramSignatureRejectsInvalidHash(t *testing.T) {
	initData := "user=%7B%22id%22%3A1%7D&hash=bad"
	if CheckTelegramWebAppSignature("token", initData) {
		t.Fatalf("invalid hash must be rejected")
	}
}
```

- [ ] **Step 3: Run failing auth tests**

```bash
cd backend
go test ./internal/auth
```

Expected: FAIL because auth functions do not exist.

- [ ] **Step 4: Implement Telegram signature and JWT primitives**

Create `backend/internal/auth/telegram.go`, `password.go`, and `jwt.go` with exported functions:

```go
func CheckTelegramWebAppSignature(token string, initData string) bool
func ParseTelegramUser(initData string) (TelegramUser, error)
func VerifyPassword(password string, encoded string) (bool, error)
func IssueTokenPair(secret string, user UserClaims) (TokenPair, error)
func ParseAccessToken(secret string, tokenString string) (UserClaims, error)
```

`UserClaims` must include `UserID int`, `Username string`, and role booleans `IsSuperuser`, `IsBaseAdmin`, `IsEditor`. Use `user_id` as the JWT claim key.

- [ ] **Step 5: Add auth route handlers**

Create handlers for:

- `POST /api/login/tg/`
- `POST /api/login/`
- `POST /api/register/`

The first implementation can use repository interfaces that are backed by tests before connecting to SQL:

```go
type UserRepository interface {
	FindByTelegramID(ctx context.Context, tgID int64) (UserRecord, error)
	CreateTelegramUser(ctx context.Context, user TelegramUser) (UserRecord, error)
	FindByUsernameOrEmail(ctx context.Context, value string) (UserRecord, error)
	CreatePasswordUser(ctx context.Context, input RegisterInput) (UserRecord, error)
	RolesForUser(ctx context.Context, userID int) (RoleSet, error)
}
```

- [ ] **Step 6: Run auth tests**

```bash
cd backend
go test ./internal/auth ./...
```

Expected: auth package PASS; repository-backed handler tests exist before SQL integration starts.

- [ ] **Step 7: Commit auth primitives**

```bash
git add backend/internal/auth backend/internal/platform/httpserver/server.go
git commit -m "feat: add compatible auth primitives"
```

## Task 4: Golden Contract Harness

**Files:**
- Create: `backend/tests/contract/corpus.yaml`
- Create: `backend/tests/contract/runner.go`
- Create: `backend/tests/contract/runner_test.go`
- Create: `backend/tools/contract-diff/main.go`
- Modify: `backend/go.mod`

- [ ] **Step 1: Write corpus for public routes**

Create `backend/tests/contract/corpus.yaml` with representative requests for every public route in the spec. Include both slash and no-slash forms for `/api/maps`, `/api/lineups`, `/api/users`, `/api/grenade-classes`, `/api/favorites/{id}`, `/api/pull_requests/{id}`, and `/api/health`.

- [ ] **Step 2: Add contract runner test**

Create `backend/tests/contract/runner_test.go`:

```go
package contract

import "testing"

func TestCorpusLoads(t *testing.T) {
	corpus, err := LoadCorpus("corpus.yaml")
	if err != nil {
		t.Fatalf("LoadCorpus returned error: %v", err)
	}
	if len(corpus.Cases) < 20 {
		t.Fatalf("expected at least 20 contract cases, got %d", len(corpus.Cases))
	}
}
```

- [ ] **Step 3: Run failing contract test**

```bash
cd backend
go test ./tests/contract
```

Expected: FAIL because `LoadCorpus` is undefined.

- [ ] **Step 4: Implement corpus loader and diff CLI**

Implement:

```go
type Corpus struct {
	Cases []Case `yaml:"cases"`
}

type Case struct {
	Name    string            `yaml:"name"`
	Method  string            `yaml:"method"`
	Path    string            `yaml:"path"`
	Headers map[string]string `yaml:"headers"`
	Body    string            `yaml:"body"`
}
```

Create CLI:

```bash
go run ./tools/contract-diff --old-base http://localhost:3001 --new-base http://localhost:3000 --corpus ./tests/contract/corpus.yaml
```

The CLI exits non-zero when status code, content type, JSON keys, enum values, nullable field presence, or representative error body differs.

- [ ] **Step 5: Run contract loader tests**

```bash
cd backend
go test ./tests/contract ./tools/contract-diff
```

Expected: PASS.

- [ ] **Step 6: Commit contract harness**

```bash
git add backend/tests/contract backend/tools/contract-diff backend/go.mod backend/go.sum
git commit -m "test: add public API contract harness"
```

## Task 5: Public Users And Grenade Classes

**Files:**
- Create: `backend/internal/users/dto.go`
- Create: `backend/internal/users/repository.go`
- Create: `backend/internal/users/handlers.go`
- Create: `backend/internal/users/routes.go`
- Create: `backend/internal/grenadeclasses/dto.go`
- Create: `backend/internal/grenadeclasses/repository.go`
- Create: `backend/internal/grenadeclasses/handlers.go`
- Create: `backend/internal/grenadeclasses/routes.go`
- Modify: `backend/internal/db/query.sql`
- Modify: `backend/internal/platform/httpserver/server.go`
- Test: `backend/internal/users/handlers_test.go`
- Test: `backend/internal/grenadeclasses/handlers_test.go`

- [ ] **Step 1: Write handler tests for public DTOs**

Create tests that assert:

- `GET /api/users/{id}` returns `user_id`, `username`, `email`, `first_name`, `last_name`, `avatar_url`, `steam_link`, `tg_id`, `is_banned`.
- `GET /api/grenade-classes` returns `grenade_class_id`, `name`, `description`, `price`.
- both slash forms return the same status.

- [ ] **Step 2: Run failing tests**

```bash
cd backend
go test ./internal/users ./internal/grenadeclasses
```

Expected: FAIL because packages are not implemented.

- [ ] **Step 3: Add sqlc queries**

Append to `backend/internal/db/query.sql`:

```sql
-- name: GetUserByID :one
select user_id, username, email, first_name, last_name, avatar_url, steam_link, tg_id, is_banned
from users
where user_id = $1;

-- name: ListUsers :many
select user_id, username, email, first_name, last_name, avatar_url, steam_link, tg_id, is_banned
from users
order by user_id;

-- name: ListGrenadeClasses :many
select grenade_class_id, name, description, price
from grenade_classes
order by grenade_class_id;

-- name: GetGrenadeClassByID :one
select grenade_class_id, name, description, price
from grenade_classes
where grenade_class_id = $1;
```

Run `sqlc generate`.

- [ ] **Step 4: Implement handlers**

Implement handlers using DTO structs with exact JSON tags:

```go
type UserDTO struct {
	UserID    int     `json:"user_id"`
	Username  string  `json:"username"`
	Email     *string `json:"email"`
	FirstName *string `json:"first_name"`
	LastName  *string `json:"last_name"`
	AvatarURL *string `json:"avatar_url"`
	SteamLink *string `json:"steam_link"`
	TgID      *int64  `json:"tg_id"`
	IsBanned  bool    `json:"is_banned"`
}
```

```go
type GrenadeClassDTO struct {
	GrenadeClassID int     `json:"grenade_class_id"`
	Name           string  `json:"name"`
	Description    *string `json:"description"`
	Price          int     `json:"price"`
}
```

- [ ] **Step 5: Run tests and contract subset**

```bash
cd backend
go test ./internal/users ./internal/grenadeclasses ./...
```

Expected: PASS.

- [ ] **Step 6: Commit public users and grenade classes**

```bash
git add backend/internal/users backend/internal/grenadeclasses backend/internal/db backend/internal/platform/httpserver/server.go
git commit -m "feat: add users and grenade class compatibility routes"
```

## Task 6: Media Storage And Public Maps

**Files:**
- Create: `backend/internal/media/storage.go`
- Create: `backend/internal/media/storage_test.go`
- Create: `backend/internal/maps/dto.go`
- Create: `backend/internal/maps/repository.go`
- Create: `backend/internal/maps/handlers.go`
- Create: `backend/internal/maps/routes.go`
- Modify: `backend/internal/db/query.sql`
- Modify: `backend/internal/platform/httpserver/server.go`
- Test: `backend/internal/maps/handlers_test.go`

- [ ] **Step 1: Write media validation tests**

Create tests for allowed `image/png`, `image/jpeg`, max size from config, path under `maps/` or `lineups/`, and URL generation using `BACKEND_SERVER`.

- [ ] **Step 2: Write map compatibility tests**

Assert:

- `GET /api/maps?ordering=by_alphabet` returns list.
- `GET /api/maps/{id}` returns `map_lineups`.
- `POST /api/maps` accepts multipart `image_link`.
- `image_link` is `null` or compatible URL.

- [ ] **Step 3: Run failing map/media tests**

```bash
cd backend
go test ./internal/media ./internal/maps
```

Expected: FAIL because packages are not implemented.

- [ ] **Step 4: Add map SQL queries**

Add list/get/create/update/delete queries for `maps`, including `quantity` count for ordering by lineup count.

- [ ] **Step 5: Implement media and map handlers**

Implement:

```go
func PublicURL(base string, mediaPath *string) *string
func SaveMultipartFile(root string, folder string, file multipart.File, header *multipart.FileHeader) (string, error)
```

Map DTO:

```go
type MapDTO struct {
	MapID         int     `json:"map_id"`
	Name          string  `json:"name"`
	Link          *string `json:"link"`
	IsEsportsPool bool    `json:"is_esports_pool"`
	ImageLink     *string `json:"image_link"`
}
```

Map detail DTO adds `MapLineups []lineups.LineupDTO json:"map_lineups"`.

- [ ] **Step 6: Run map/media tests**

```bash
cd backend
go test ./internal/media ./internal/maps ./...
```

Expected: PASS.

- [ ] **Step 7: Commit media and maps**

```bash
git add backend/internal/media backend/internal/maps backend/internal/db backend/internal/platform/httpserver/server.go
git commit -m "feat: add media storage and map routes"
```

## Task 7: Public Lineups And Derived Fields

**Files:**
- Create: `backend/internal/lineups/dto.go`
- Create: `backend/internal/lineups/repository.go`
- Create: `backend/internal/lineups/filters.go`
- Create: `backend/internal/lineups/handlers.go`
- Create: `backend/internal/lineups/routes.go`
- Modify: `backend/internal/db/query.sql`
- Modify: `backend/internal/platform/httpserver/server.go`
- Test: `backend/internal/lineups/handlers_test.go`
- Test: `backend/internal/lineups/filters_test.go`

- [ ] **Step 1: Write lineup filter tests**

Assert supported filters: `is_approved`, `ordering`, `query`, `by_user_name`; assert unknown `creator_id` is ignored and does not return `400`.

- [ ] **Step 2: Write lineup DTO tests**

Assert lineup DTO includes `creator`, `grenade_class`, `property_list`, `is_favorite`, and `request` with `WAITING FOR CREATION` when no PR exists.

- [ ] **Step 3: Run failing lineup tests**

```bash
cd backend
go test ./internal/lineups
```

Expected: FAIL because package is not implemented.

- [ ] **Step 4: Add lineup SQL queries**

Add queries for list, get, create, update, delete, change grenade class, property list lookup, favorite lookup, and PR status lookup.

- [ ] **Step 5: Implement lineups**

Use DTO structs with exact JSON tags:

```go
type RequestStatusDTO struct {
	RequestID *int   `json:"request_id"`
	Status    string `json:"status"`
}
```

```go
type LineupDTO struct {
	UserID           int                 `json:"user_id"`
	GrenadeID        int                 `json:"grenade_id"`
	MapID            int                 `json:"map_id"`
	LinkToVideo      *string             `json:"link_to_video"`
	Creator          users.ProfileDTO    `json:"creator"`
	CreatedAt        string              `json:"created_at"`
	Title            string              `json:"title"`
	Description      *string             `json:"description"`
	IsApproved       bool                `json:"is_approved"`
	IsFavorite       bool                `json:"is_favorite"`
	Views            int                 `json:"views"`
	PreviewImageLink *string             `json:"preview_image_link"`
	GrenadeClass     GrenadeClassDTO     `json:"grenade_class"`
	PropertyList     []PropertyInlineDTO `json:"property_list"`
	Request          RequestStatusDTO    `json:"request"`
}
```

- [ ] **Step 6: Run lineup tests**

```bash
cd backend
go test ./internal/lineups ./...
```

Expected: PASS.

- [ ] **Step 7: Commit lineups**

```bash
git add backend/internal/lineups backend/internal/db backend/internal/platform/httpserver/server.go
git commit -m "feat: add lineup compatibility routes"
```

## Task 8: Properties And Favorites

**Files:**
- Create: `backend/internal/properties/dto.go`
- Create: `backend/internal/properties/repository.go`
- Create: `backend/internal/properties/handlers.go`
- Create: `backend/internal/properties/routes.go`
- Create: `backend/internal/favorites/dto.go`
- Create: `backend/internal/favorites/repository.go`
- Create: `backend/internal/favorites/handlers.go`
- Create: `backend/internal/favorites/routes.go`
- Modify: `backend/internal/db/query.sql`
- Modify: `backend/internal/platform/httpserver/server.go`
- Test: `backend/internal/properties/handlers_test.go`
- Test: `backend/internal/favorites/handlers_test.go`

- [ ] **Step 1: Write property link tests**

Assert `GET /api/property-list?grenade_id=1`, `POST /api/lineups/{id}/properties`, duplicate relation errors, and delete missing relation `404`.

- [ ] **Step 2: Write favorites overload tests**

Assert:

- `POST /api/favorites` uses current authenticated user.
- `GET /api/favorites/{id}` treats `{id}` as `user_id`.
- `DELETE /api/favorites/{id}` treats `{id}` as `grenade_id`.
- duplicate favorite returns DRF-like `non_field_errors`.

- [ ] **Step 3: Run failing tests**

```bash
cd backend
go test ./internal/properties ./internal/favorites
```

Expected: FAIL because packages are not implemented.

- [ ] **Step 4: Implement properties and favorites**

Use DTOs:

```go
type PropertyDTO struct {
	PropertyID int     `json:"property_id"`
	Name       string  `json:"name"`
	Value      *string `json:"value"`
}
```

```go
type FavoriteCreateResponse struct {
	UserID    int `json:"user_id"`
	GrenadeID int `json:"grenade_id"`
}
```

- [ ] **Step 5: Run tests**

```bash
cd backend
go test ./internal/properties ./internal/favorites ./...
```

Expected: PASS.

- [ ] **Step 6: Commit properties and favorites**

```bash
git add backend/internal/properties backend/internal/favorites backend/internal/db backend/internal/platform/httpserver/server.go
git commit -m "feat: add properties and favorites compatibility routes"
```

## Task 9: Pull Requests And REST Comments

**Files:**
- Create: `backend/internal/pullrequests/dto.go`
- Create: `backend/internal/pullrequests/repository.go`
- Create: `backend/internal/pullrequests/permissions.go`
- Create: `backend/internal/pullrequests/handlers.go`
- Create: `backend/internal/pullrequests/routes.go`
- Modify: `backend/internal/db/query.sql`
- Modify: `backend/internal/platform/httpserver/server.go`
- Test: `backend/internal/pullrequests/handlers_test.go`
- Test: `backend/internal/pullrequests/permissions_test.go`

- [ ] **Step 1: Write PR permission tests**

Assert:

- creator can cancel own PR;
- non-creator non-admin cannot cancel;
- admin can approve/reject;
- editor cannot approve/reject;
- `PUT` returns `405`.

- [ ] **Step 2: Write comment DTO tests**

Assert comments are ordered by `created_at` and creator has `role`.

- [ ] **Step 3: Run failing PR tests**

```bash
cd backend
go test ./internal/pullrequests
```

Expected: FAIL because package is not implemented.

- [ ] **Step 4: Implement PRs and comments**

Preserve statuses: `OPEN`, `APPROVED`, `REJECTED`, `MERGED`, `CLOSED`. Preserve detail messages:

```json
{ "detail": "Pull request approved." }
```

```json
{ "detail": "Pull request rejected." }
```

```json
{ "detail": "Pull request cancelled." }
```

- [ ] **Step 5: Run tests**

```bash
cd backend
go test ./internal/pullrequests ./...
```

Expected: PASS.

- [ ] **Step 6: Commit PR REST routes**

```bash
git add backend/internal/pullrequests backend/internal/db backend/internal/platform/httpserver/server.go
git commit -m "feat: add pull request and comment routes"
```

## Task 10: WebSocket Comments And Token Redaction

**Files:**
- Create: `backend/internal/realtime/hub.go`
- Create: `backend/internal/realtime/handler.go`
- Create: `backend/internal/realtime/handler_test.go`
- Create: `backend/internal/platform/logger/redaction_test.go`
- Create: `backend/tools/logscan/main.go`
- Modify: `backend/internal/platform/httpserver/server.go`
- Modify: `tg-frontend/src/widgets/request-feed/request-feed.tsx`
- Test: `backend/internal/realtime/handler_test.go`

- [ ] **Step 1: Write WebSocket auth tests**

Assert:

- missing token rejected;
- malformed token rejected;
- expired token rejected;
- `create` with mismatched `user_id` rejected;
- unauthorized delete rejected;
- valid create broadcasts full comment array.

- [ ] **Step 2: Write redaction tests**

Create `backend/internal/platform/logger/redaction_test.go`:

```go
package logger

import "testing"

func TestRedactTokenQuery(t *testing.T) {
	input := "/ws/api/pull_requests/1/comments/?token=secret.jwt.value&x=1"
	got := RedactURL(input)
	if got == input {
		t.Fatalf("URL was not redacted")
	}
	if contains := "secret.jwt.value"; contains != "" && hasSubstring(got, contains) {
		t.Fatalf("redacted URL leaked token: %s", got)
	}
}
```

Implement `hasSubstring` in the test or use `strings.Contains`.

- [ ] **Step 3: Run failing realtime tests**

```bash
cd backend
go test ./internal/realtime ./internal/platform/logger
```

Expected: FAIL because realtime and redaction functions are missing.

- [ ] **Step 4: Implement WebSocket handler**

Use `nhooyr.io/websocket`. Route:

```text
/ws/api/pull_requests/{pr_id}/comments/
```

Authenticate using `token` query parameter. Derive actor from JWT. Accept `user_id` in create payload only if it matches the token user.

- [ ] **Step 5: Implement frontend adapter**

Modify only `tg-frontend/src/widgets/request-feed/request-feed.tsx`:

- derive WS base from `VITE_BACKEND_URL`;
- append `token=${accessToken}`;
- keep message payloads and rendering unchanged.

- [ ] **Step 6: Run backend and frontend checks**

```bash
cd backend
go test ./internal/realtime ./internal/platform/logger ./...
cd ../tg-frontend
npm run type-check
npm run test
```

Expected: backend tests PASS; frontend type-check and tests PASS.

- [ ] **Step 7: Commit WebSocket compatibility**

```bash
git add backend/internal/realtime backend/internal/platform/logger backend/tools/logscan backend/internal/platform/httpserver/server.go tg-frontend/src/widgets/request-feed/request-feed.tsx
git commit -m "feat: add authenticated websocket comments"
```

## Task 11: Cache Layer And Invalidation

**Files:**
- Create: `backend/internal/cache/cache.go`
- Create: `backend/internal/cache/cache_test.go`
- Create: `backend/internal/cache/keys.go`
- Modify: `backend/internal/maps/handlers.go`
- Modify: `backend/internal/lineups/handlers.go`
- Modify: `backend/internal/favorites/handlers.go`
- Modify: `backend/internal/properties/handlers.go`
- Modify: `backend/internal/grenadeclasses/handlers.go`
- Modify: `backend/internal/pullrequests/handlers.go`
- Test: `backend/internal/cache/cache_test.go`

- [ ] **Step 1: Write cache key tests**

Assert stable keys for:

- map list query hash;
- map detail id;
- lineup list query hash;
- lineup detail id;
- filters and sorts static keys.

- [ ] **Step 2: Write invalidation tests**

Assert:

- creating/updating/deleting maps invalidates map list and detail keys;
- creating/updating/deleting lineups invalidates lineup list/detail and related map detail keys;
- favorites writes invalidate lineup derived `is_favorite` data;
- pull request status writes invalidate lineup derived `request` data;
- grenade class/property writes invalidate lineup DTO data.

- [ ] **Step 3: Run failing cache tests**

```bash
cd backend
go test ./internal/cache
```

Expected: FAIL because cache package is not implemented.

- [ ] **Step 4: Implement cache package**

Create:

```go
type Store interface {
	GetJSON(ctx context.Context, key string, target any) (bool, error)
	SetJSON(ctx context.Context, key string, value any, ttl time.Duration) error
	Delete(ctx context.Context, keys ...string) error
	DeletePattern(ctx context.Context, pattern string) error
}
```

Use Redis in production code and an in-memory fake in tests.

- [ ] **Step 5: Wire invalidation into write handlers**

Update write handlers to call explicit invalidation functions:

```go
func InvalidateMapList(ctx context.Context, store Store) error
func InvalidateLineupList(ctx context.Context, store Store) error
func InvalidateLineupDerived(ctx context.Context, store Store, grenadeID int) error
```

- [ ] **Step 6: Run cache and route tests**

```bash
cd backend
go test ./internal/cache ./internal/maps ./internal/lineups ./internal/favorites ./internal/properties ./internal/grenadeclasses ./internal/pullrequests ./...
```

Expected: PASS.

- [ ] **Step 7: Commit cache layer**

```bash
git add backend/internal/cache backend/internal/maps backend/internal/lineups backend/internal/favorites backend/internal/properties backend/internal/grenadeclasses backend/internal/pullrequests
git commit -m "feat: add cache layer and invalidation"
```

## Task 12: Admin API Roles

**Files:**
- Create: `backend/internal/admin/dto.go`
- Create: `backend/internal/admin/roles.go`
- Create: `backend/internal/admin/handlers.go`
- Create: `backend/internal/admin/routes.go`
- Modify: `backend/internal/db/query.sql`
- Modify: `backend/internal/platform/httpserver/server.go`
- Test: `backend/internal/admin/roles_test.go`
- Test: `backend/internal/admin/handlers_test.go`

- [ ] **Step 1: Write role matrix tests**

Assert:

- superuser can grant roles;
- base_admin cannot grant roles or delete users;
- editor cannot approve/reject PRs;
- authenticated non-admin cannot access `/api/admin/*`;
- anonymous cannot access `/api/admin/*`;
- tampered JWT role claim does not bypass DB role checks.

- [ ] **Step 2: Run failing admin tests**

```bash
cd backend
go test ./internal/admin
```

Expected: FAIL because admin package is not implemented.

- [ ] **Step 3: Implement role matrix**

Create functions:

```go
func CanGrantRoles(roles RoleSet) bool
func CanModeratePullRequests(roles RoleSet) bool
func CanManageContent(roles RoleSet) bool
func CanViewUsers(roles RoleSet) bool
func CanDeleteUsers(roles RoleSet) bool
```

- [ ] **Step 4: Add admin routes**

Implement:

- `GET /api/admin/me`
- `GET /api/admin/pull-requests`
- `GET /api/admin/pull-requests/{id}`
- `PATCH /api/admin/pull-requests/{id}/approve`
- `PATCH /api/admin/pull-requests/{id}/reject`
- `PATCH /api/admin/pull-requests/{id}/cancel`
- `GET /api/admin/users`
- `PATCH /api/admin/users/{id}/roles`
- admin CRUD wrappers for maps, lineups, grenade classes, properties.

- [ ] **Step 5: Run admin tests**

```bash
cd backend
go test ./internal/admin ./...
```

Expected: PASS.

- [ ] **Step 6: Commit admin API**

```bash
git add backend/internal/admin backend/internal/db backend/internal/platform/httpserver/server.go
git commit -m "feat: add admin API role enforcement"
```

## Task 13: Admin Frontend Scaffold

**Files:**
- Create: `admin-frontend/package.json`
- Create: `admin-frontend/vite.config.ts`
- Create: `admin-frontend/tsconfig.json`
- Create: `admin-frontend/index.html`
- Create: `admin-frontend/src/app/main.tsx`
- Create: `admin-frontend/src/app/router.tsx`
- Create: `admin-frontend/src/app/providers.tsx`
- Create: `admin-frontend/src/app/styles.css`
- Create: `admin-frontend/src/shared/api/client.ts`
- Create: `admin-frontend/src/shared/auth/session.ts`
- Create: `admin-frontend/src/pages/login.tsx`
- Create: `admin-frontend/dockerfile.dev`
- Create: `admin-frontend/README.md`

- [ ] **Step 1: Initialize Vite app files**

Use React 18, TypeScript, Vite, Axios, TanStack Query, Zod, and lucide-react. Match `tg-frontend` script names where possible:

```json
{
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint ./src",
    "type-check": "tsc --noEmit --pretty --skipLibCheck -p tsconfig.json",
    "test": "vitest run"
  }
}
```

- [ ] **Step 2: Write session tests**

Create tests for `sessionStorage` persistence, in-memory token read, and logout clearing both.

- [ ] **Step 3: Run failing admin frontend tests**

```bash
cd admin-frontend
npm install
npm run type-check
npm run test
```

Expected: tests or type-check fail until files are implemented.

- [ ] **Step 4: Implement scaffold**

Implement routes:

- `/login`
- `/pull-requests`
- `/pull-requests/:id`
- `/maps`
- `/lineups`
- `/grenade-classes`
- `/properties`
- `/users`

Use `VITE_ADMIN_API_URL` as the only API base URL source.

- [ ] **Step 5: Run scaffold checks**

```bash
cd admin-frontend
npm run type-check
npm run test
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit admin scaffold**

```bash
git add admin-frontend
git commit -m "feat: scaffold admin frontend"
```

## Task 14: Admin Moderation UI

**Files:**
- Create: `admin-frontend/src/entities/pull-request/api.ts`
- Create: `admin-frontend/src/entities/pull-request/schema.ts`
- Create: `admin-frontend/src/pages/pull-requests/list.tsx`
- Create: `admin-frontend/src/pages/pull-requests/detail.tsx`
- Create: `admin-frontend/src/widgets/pr-status-actions.tsx`
- Test: `admin-frontend/src/pages/pull-requests/list.test.tsx`
- Test: `admin-frontend/src/pages/pull-requests/detail.test.tsx`

- [ ] **Step 1: Write UI tests**

Assert:

- PR queue shows status filters;
- base_admin sees approve/reject/cancel buttons;
- editor does not see approve/reject buttons;
- failed backend authorization displays admin error message.

- [ ] **Step 2: Run failing UI tests**

```bash
cd admin-frontend
npm run test -- pull-requests
```

Expected: FAIL until moderation UI exists.

- [ ] **Step 3: Implement moderation pages**

Use tables, compact filters, and detail panel. Avoid cards inside cards. Keep controls dense and operational.

- [ ] **Step 4: Run admin checks**

```bash
cd admin-frontend
npm run type-check
npm run test
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit moderation UI**

```bash
git add admin-frontend/src/entities/pull-request admin-frontend/src/pages/pull-requests admin-frontend/src/widgets/pr-status-actions.tsx
git commit -m "feat: add admin moderation workspace"
```

## Task 15: Admin Content UI

**Files:**
- Create: `admin-frontend/src/entities/map/api.ts`
- Create: `admin-frontend/src/entities/lineup/api.ts`
- Create: `admin-frontend/src/entities/grenade-class/api.ts`
- Create: `admin-frontend/src/entities/property/api.ts`
- Create: `admin-frontend/src/entities/user/api.ts`
- Create: `admin-frontend/src/pages/maps.tsx`
- Create: `admin-frontend/src/pages/lineups.tsx`
- Create: `admin-frontend/src/pages/grenade-classes.tsx`
- Create: `admin-frontend/src/pages/properties.tsx`
- Create: `admin-frontend/src/pages/users.tsx`
- Test: admin page tests for CRUD and role restrictions.

- [ ] **Step 1: Write CRUD smoke tests**

Assert maps, lineups, grenade classes, properties, and users pages render tables, create/edit forms, and role-disabled states.

- [ ] **Step 2: Run failing tests**

```bash
cd admin-frontend
npm run test -- maps lineups grenade-classes properties users
```

Expected: FAIL until pages exist.

- [ ] **Step 3: Implement content pages**

Use shared table/form components only after two pages repeat the same structure. Keep forms explicit for fields from the public/admin DTOs.

- [ ] **Step 4: Run admin checks**

```bash
cd admin-frontend
npm run type-check
npm run test
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit content UI**

```bash
git add admin-frontend/src/entities admin-frontend/src/pages
git commit -m "feat: add admin content management screens"
```

## Task 16: Production Migration Tool

**Files:**
- Create: `backend/tools/migrate-django/main.go`
- Create: `backend/tools/migrate-django/report.go`
- Create: `backend/tools/migrate-django/extract.go`
- Create: `backend/tools/migrate-django/load.go`
- Create: `backend/tools/migrate-django/media.go`
- Test: `backend/tools/migrate-django/report_test.go`
- Test: `backend/tools/migrate-django/media_test.go`

- [ ] **Step 1: Write report tests**

Assert report fails on:

- missing required parent row;
- ID remap attempt;
- duplicate non-null `tg_id`;
- missing media file that existed in source path;
- target sequence lower than max migrated ID.

- [ ] **Step 2: Run failing migration tool tests**

```bash
cd backend
go test ./tools/migrate-django
```

Expected: FAIL until tool exists.

- [ ] **Step 3: Implement dry-run command**

Command:

```bash
go run ./tools/migrate-django \
  --source "postgres://old:old@localhost:5432/old?sslmode=disable" \
  --target "postgres://new:new@localhost:5433/new?sslmode=disable" \
  --source-media ./tmp/django-media \
  --target-media ./tmp/go-media \
  --dry-run
```

Output includes row counts, ID preservation report, orphan report, media report, auth sample report, and sequence report.

- [ ] **Step 4: Implement load mode**

Load mode copies rows preserving IDs exactly and exits non-zero when any required guarantee fails.

- [ ] **Step 5: Run migration tests**

```bash
cd backend
go test ./tools/migrate-django ./...
```

Expected: PASS.

- [ ] **Step 6: Commit migration tool**

```bash
git add backend/tools/migrate-django
git commit -m "feat: add Django data migration tool"
```

## Task 17: Docker, nginx, OpenAPI, And Docs

**Files:**
- Modify: `docker-compose.yaml`
- Modify: `docker-compose.prod.yaml`
- Modify: `nginx/nginx.conf`
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `backend/README.md`
- Create: `backend/internal/openapi/openapi.go`
- Modify: `backend/internal/platform/httpserver/server.go`
- Create: `admin-frontend/dockerfile.prod`

- [ ] **Step 1: Update Compose**

Set:

- backend host port `3000`;
- tg frontend host port `8000`;
- admin frontend host port `8001`;
- Redis and PostgreSQL remain available with existing host ports unless conflict appears.

- [ ] **Step 2: Update nginx with redaction**

Add `/api/*`, `/ws/api/*`, `/media/*`, `/admin/*` routing. Ensure access logs do not emit raw query strings for WebSocket token URLs.

- [ ] **Step 3: Add OpenAPI route**

Serve `/api/schema` and `/api/docs` from Go or replace `info-service` docs with Go-served OpenAPI. Keep local docs accessible.

- [ ] **Step 4: Run Docker smoke**

```bash
docker compose up --build -d
curl -fsS http://localhost:3000/api/health
curl -fsS http://localhost:8000
curl -fsS http://localhost:8001
docker compose down
```

Expected: all curl commands exit 0.

- [ ] **Step 5: Commit deployment docs**

```bash
git add docker-compose.yaml docker-compose.prod.yaml nginx/nginx.conf .env.example README.md backend/README.md admin-frontend/dockerfile.prod backend/internal/openapi backend/internal/platform/httpserver/server.go
git commit -m "chore: update Docker nginx and docs for Go backend"
```

## Task 18: End-To-End Verification And Release Rehearsal

**Files:**
- Create: `docs/release/golang-backend-cutover.md`
- Create: `docs/release/golang-backend-rollback.md`
- Create: `backend/tests/e2e/README.md`
- Modify: `backend/tests/contract/corpus.yaml`

- [ ] **Step 1: Run full backend checks**

```bash
cd backend
go test ./...
```

Expected: PASS.

- [ ] **Step 2: Run frontend checks**

```bash
cd tg-frontend
npm run type-check
npm run test
npm run build
cd ../admin-frontend
npm run type-check
npm run test
npm run build
```

Expected: PASS.

- [ ] **Step 3: Run contract diff**

Start Django on `localhost:3001` and Go on `localhost:3000`, then run:

```bash
cd backend
go run ./tools/contract-diff --old-base http://localhost:3001 --new-base http://localhost:3000 --corpus ./tests/contract/corpus.yaml
```

Expected: PASS with no unapproved differences.

- [ ] **Step 4: Run migration dry-run**

```bash
cd backend
go run ./tools/migrate-django \
  --source "postgres://old:old@localhost:5432/old?sslmode=disable" \
  --target "postgres://new:new@localhost:5433/new?sslmode=disable" \
  --source-media ./tmp/django-media \
  --target-media ./tmp/go-media \
  --dry-run
```

Expected: report shows preserved IDs, no required orphan blockers, valid media references, valid sequence values.

- [ ] **Step 5: Run token redaction scan**

```bash
cd backend
go run ./tools/logscan --sentinel "sentinel.jwt.value" --logs ./tmp/logscan
```

Expected: PASS and raw sentinel absent from nginx, backend, app, metrics, trace, and client diagnostic captures.

- [ ] **Step 6: Document cutover and rollback**

Write:

- `docs/release/golang-backend-cutover.md`: backup, write freeze, migration, smoke, route switch, write gate opening.
- `docs/release/golang-backend-rollback.md`: pre-write rollback and post-write no-loss reconciliation/forward-fix rule.

- [ ] **Step 7: Commit verification docs**

```bash
git add docs/release backend/tests
git commit -m "docs: add Go backend release rehearsal"
```

## Self-Review Checklist

- [ ] Every public route listed in the approved spec has a task: auth routes, users, maps, grenade classes, lineups, properties, property-list links, favorites, pull requests, comments, health, and WebSocket.
- [ ] The plan preserves current `tg-frontend` REST contracts and limits frontend edits to the WebSocket token/base-URL adapter.
- [ ] The plan includes data migration with exact ID preservation, password hash compatibility, media checks, orphan report, cutover, and rollback.
- [ ] The plan includes admin role matrix enforcement and a separate `admin-frontend/`.
- [ ] The plan includes token query redaction and sentinel log scan verification.
- [ ] The plan includes Docker, nginx, docs, contract diff, migration rehearsal, rollback rehearsal, and E2E checks.
- [ ] Each task has a commit boundary and concrete verification command.

## Execution Handoff

Plan implementation starts by creating Beads issues from the task list above. The first implementation issue is `Backend foundation`; dependent issues follow the dependency order in the approved spec and this plan.
