# E2E Smoke Entry Points

The deterministic frontend smoke entry points are:

```bash
cd tg-frontend && npm run test:e2e
cd admin-frontend && npm run test:e2e
```

Admin rendered flows were additionally checked with Playwright route mocks
during this branch: moderation, users/roles, lineups CRUD, catalog CRUD, and
backend authorization error rendering.

Production-like backend release checks are recorded in
`docs/release/golang-backend-rehearsal-2026-06-18.md`.
