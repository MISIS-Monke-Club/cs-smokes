# Go Backend Rollback Runbook

## Before Go Writes Are Enabled

If migration validation, contract diff, smoke, or log redaction checks fail while
`WRITE_GATE=true`, switch nginx routing back to the legacy Django stack and keep
the restored Django database as the write authority. No Go-side accepted writes
should exist in this path.

## After Go Writes Are Enabled

Do not discard accepted Go writes. Rollback after `WRITE_GATE=false` requires a
forward fix or a rehearsed reconciliation plan that preserves or replays every
accepted write into the restored authority.

## Required Evidence

- Failing check name and logs.
- Current `WRITE_GATE` value.
- Database backup identifier and restore target.
- Whether any Go writes were accepted.
- Chosen path: route back before writes, forward-fix, or reconciled rollback.
