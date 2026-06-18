# Go Backend Cutover Runbook

## Preconditions

- Final production database backup is completed and restore-tested.
- `WRITE_GATE=true` and `WS_ALLOW_UNAUTHENTICATED_DEV=false` in production env.
- Go backend image, admin frontend image, nginx config, and migration tool are
  built from the same commit.

## Sequence

1. Freeze public and admin writes.
2. Run Django-to-Go migration with ID preservation checks.
3. Run `go test ./...`, contract diff, migration validation, and WebSocket
   redaction probe against the migrated database.
4. Deploy `docker-compose.prod.yaml` with nginx routing `/api`, `/ws/api`,
   `/media`, `/admin`, and `/`.
5. Smoke public maps/lineups, auth, favorites, PR comments, admin moderation,
   admin users/roles, admin lineups, and admin catalog flows.
6. Open writes only by setting `WRITE_GATE=false` after the release owner records
   all passing evidence.

## Verification Commands

```bash
docker compose -f docker-compose.prod.yaml config
docker compose -f docker-compose.prod.yaml build backend admin-frontend nginx
cd backend && go test ./...
python3 -m unittest discover -s backend/tests
python3 -m flake8 backend/tests/test_legacy_contract_baseline.py
```
