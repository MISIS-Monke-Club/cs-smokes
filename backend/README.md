# CS Smokes Go Backend

Go replacement for the legacy Django REST API. Public `/api/*` routes preserve
the frontend-facing DTOs and field names used by `tg-frontend`; stricter
moderation and content tooling lives under `/api/admin/*`.

## Local Checks

```bash
go test ./...
python3 -m unittest discover -s tests
```

## Runtime Notes

- `WRITE_GATE=true` keeps mutating HTTP methods closed during migration and
  cutover rehearsal.
- Redis is used as a best-effort cache for public maps/lineups reads. Cache
  failures fall back to PostgreSQL; repository errors are still returned.
- `/api/schema` serves the Go OpenAPI document and `/api/docs` serves a small
  docs page.
- `/ws/api/pull_requests/{id}/comments/?token=...` accepts WebSocket comment
  traffic. Production nginx logs use a redacted format that omits query strings.
