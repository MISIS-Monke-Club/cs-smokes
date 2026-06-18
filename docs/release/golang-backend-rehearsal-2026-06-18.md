# Go Backend Release Rehearsal Evidence - 2026-06-18

## Scope

This rehearsal covers the Go backend replacement, admin frontend, migration
tooling, cache layer, OpenAPI/docs, nginx routing, and rollback runbooks.

## Commands Run

```bash
cd backend && go test ./...
python3 -m unittest discover -s backend/tests
python3 -m flake8 backend/tests/test_legacy_contract_baseline.py
cd tg-frontend && npm run test:e2e
cd admin-frontend && npm run test:e2e && npm run build
FRONTEND_LINTING=0 MODE=development docker compose config
FRONTEND_LINTING=0 MODE=production docker compose -f docker-compose.prod.yaml config
docker compose -f docker-compose.prod.yaml build backend
docker run --rm ... nginx:alpine nginx -t
```

## Browser Smokes

- Admin moderation queue/detail/comment flows were exercised with mocked API.
- Admin users/roles flow was exercised with mocked API and verified role PUT
  payloads.
- Admin lineups flow was exercised with mocked API and verified filter query,
  multipart create/edit payloads, delete request, and backend `403` notice.
- Admin catalog flow was exercised with mocked API and verified map multipart
  edit, class/property JSON create, property relation create, and backend `403`
  notice.

## Release Gates

- `WRITE_GATE=true` remains the production default in compose until migration,
  contract, WebSocket redaction, and smoke evidence is recorded.
- Nginx access logs use a redacted format that omits query strings, including
  WebSocket `token` query values.
- Rollback before accepted Go writes routes traffic back to Django. Rollback
  after accepted Go writes requires forward-fix or reconciliation with no lost
  writes.

## Caveat

Local Docker admin-frontend image build repeatedly hung at `npm ci` inside
Docker because Docker-internal npm registry access did not complete. The admin
frontend package lock, production Dockerfile, local tests, type-check, and build
were verified; final cutover must retry the admin image build in an environment
with working npm registry access.
