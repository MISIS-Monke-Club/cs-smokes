# Legacy Contract Capture

The preserved Django baseline runs beside the future Go backend on
`localhost:3001`.

## Start Baseline

```bash
docker compose -f docker-compose.yaml -f docker-compose.legacy-django.yaml up --build -d db redis legacy-django
curl -fsS http://localhost:3001/api/health
```

Expected result: the health endpoint returns HTTP 200 from the
`legacy-django` service.

## Seed Deterministic Data

The service startup script applies migrations and runs:

```bash
python manage.py seed_data
```

Use only deterministic demo data or sanitized fixtures. Do not write secrets,
raw credentials, production user data, raw Telegram payloads, or bearer values
into captured fixtures.

## Refresh Corpus

Refresh must be intentional:

```bash
LEGACY_DJANGO_REF=<commit-sha> docker compose -f docker-compose.yaml -f docker-compose.legacy-django.yaml up --build -d db redis legacy-django
curl -fsS http://localhost:3001/api/health
```

After health succeeds, run the contract capture command for the route corpus
and update `docs/legacy-contract/manifest.json` with the reviewed metadata.

Run the golden diff against the preserved Django baseline and the Go backend:

```bash
cd backend
go run ./tools/contract-diff \
  --old-base http://localhost:3001 \
  --new-base http://localhost:3000 \
  --corpus ./tests/contract/corpus.yaml
```

## Stop Baseline

```bash
docker compose -f docker-compose.yaml -f docker-compose.legacy-django.yaml stop legacy-django
```
