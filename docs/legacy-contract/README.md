# Legacy Django Contract Baseline

This directory records how to replay and refresh the Django API baseline used
while replacing the default backend runtime with Go.

## Replay

Start PostgreSQL, Redis, and the preserved Django service on port 3001:

```bash
docker compose -f docker-compose.yaml -f docker-compose.legacy-django.yaml up --build -d db redis legacy-django
curl -fsS http://localhost:3001/api/health
```

The service builds from `backend/dockerfile.legacy-django`. That Dockerfile
checks out the Django backend from the baseline git commit recorded in
`manifest.json`, so the baseline can still be rebuilt after `backend/` becomes
the Go service.

## Fixture Data

The legacy container uses the current Django startup script, including:

```bash
python manage.py migrate
python manage.py seed_data
```

Do not use production data for this baseline. If a richer corpus is needed,
create a sanitized fixture and record its path and checksum in
`manifest.json`.

## Refresh

Refresh is explicit and reviewable:

1. Set `LEGACY_DJANGO_REF` to the Django commit that should become the new
   baseline.
2. Rebuild and start the service:

   ```bash
   LEGACY_DJANGO_REF=<commit-sha> docker compose -f docker-compose.yaml -f docker-compose.legacy-django.yaml up --build -d db redis legacy-django
   curl -fsS http://localhost:3001/api/health
   ```

3. Capture the route corpus with the contract harness for that commit.
4. Update `manifest.json` with the new commit, capture time, corpus version,
   fixture description, and any accepted legacy quirks.
5. Review the diff before accepting the refreshed corpus.

Stop the baseline service when finished:

```bash
docker compose -f docker-compose.yaml -f docker-compose.legacy-django.yaml stop legacy-django
```
