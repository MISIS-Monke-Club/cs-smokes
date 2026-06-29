# Go Telegram Bot Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Python aiogram Telegram bot with a Go implementation while preserving the existing `/start` Web App button behavior and compose service contract.

**Architecture:** The bot becomes a small Go module under `bot/`. Pure packages build configuration, Web App URLs, outgoing Telegram messages, and update handling; `cmd/bot` wires those pieces to a minimal Bot API polling client. Tests cover pure behavior and HTTP client behavior without requiring a real Telegram token.

**Tech Stack:** Go 1.25.5, standard `net/http`/`encoding/json`, Docker multi-stage builds, Docker Compose.

---

## Task 1: Bot Behavior Tests

**Files:**
- Create: `bot/go.mod`
- Create: `bot/internal/config/config_test.go`
- Create: `bot/internal/webapp/webapp_test.go`
- Create: `bot/internal/telegram/message_test.go`
- Create: `bot/internal/telegram/client_test.go`

- [ ] **Step 1: Initialize module**

Run:

```bash
cd bot
go mod init github.com/MISIS-Monke-Club/cs-smokes/bot
go mod tidy
```

Expected: `bot/go.mod` exists.

- [ ] **Step 2: Write failing tests**

Cover these required behaviors before production code:

- config rejects missing `TOKEN` and `WEB_APP_URL`;
- config loads valid env into typed values;
- Web App URL appends `initData` while preserving existing query parameters;
- `/start` response text and button text match the Python bot;
- Telegram client sends `sendMessage` JSON with inline `web_app` keyboard;
- update handler ignores non-`/start` messages and handles `/start` messages.

- [ ] **Step 3: Verify red**

Run:

```bash
cd bot
go test ./...
```

Expected: FAIL because implementation packages do not exist yet.

## Task 2: Go Bot Runtime

**Files:**
- Create: `bot/cmd/bot/main.go`
- Create: `bot/internal/config/config.go`
- Create: `bot/internal/webapp/webapp.go`
- Create: `bot/internal/telegram/types.go`
- Create: `bot/internal/telegram/message.go`
- Create: `bot/internal/telegram/client.go`
- Create: `bot/internal/telegram/handler.go`

- [ ] **Step 1: Implement minimal code for tests**

Implement only the behavior covered by Task 1 tests:

- typed config from environment;
- safe URL construction with `net/url`;
- typed Telegram Bot API request/response structs;
- long polling loop using `getUpdates`;
- `/start` handler sending the preserved Russian message and Web App button.

- [ ] **Step 2: Verify green**

Run:

```bash
cd bot
go test ./...
go test ./... -coverprofile=coverage.out
go tool cover -func=coverage.out
```

Expected: all packages pass and total coverage is `100.0%`.

## Task 3: Remove Python Runtime And Update Compose

**Files:**
- Delete: `bot/bot.py`
- Delete: `bot/requirements_bot.txt`
- Modify: `bot/Dockerfile`
- Modify: `bot/tests-on-enter.sh`
- Modify: `bot/.devcontainer/devcontainer.json`
- Modify: `bot/README.md`
- Modify: `docker-compose.yaml`
- Modify: `docker-compose.prod.yaml`

- [ ] **Step 1: Replace Docker image**

Use a Go multi-stage Dockerfile that runs `go test ./...` during build and copies the compiled bot binary into a small runtime image.

- [ ] **Step 2: Replace compose commands**

Update dev and prod `bot` services to run the Go binary or `go run ./cmd/bot`, keep `TOKEN` and `WEB_APP_URL`, and preserve frontend `depends_on: bot`.

- [ ] **Step 3: Remove Python tails**

Remove Python source/dependency files from `bot/` and replace Python devcontainer/test references with Go tooling.

## Task 4: Verification

**Files:**
- Modify only files needed to fix verification failures.

- [ ] **Step 1: Run bot quality gates**

```bash
cd bot
go test ./...
go test ./... -coverprofile=coverage.out
go tool cover -func=coverage.out
docker build -t cs-smokes-go-bot-test ./bot
```

- [ ] **Step 2: Run compose validation**

```bash
docker compose -f docker-compose.yaml config
docker compose -f docker-compose.prod.yaml config
```

- [ ] **Step 3: Run Python-tail guard**

```bash
find bot -type f \( -name '*.py' -o -name 'requirements*.txt' \) -print
```

Expected: no output.
