// Package cache provides best-effort public-read caching decorators.
//
// Cache failures are intentionally non-fatal: get, set, and invalidation
// errors are ignored by decorators so reads and writes continue against the
// backing repository. Repository errors are still returned unchanged.
package cache
