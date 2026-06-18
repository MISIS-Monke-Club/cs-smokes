package cache

import (
	"time"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/platform/httpserver"
)

func WrapRepositories(repos httpserver.Repositories, store Store, ttl time.Duration) httpserver.Repositories {
	if store == nil {
		return repos
	}
	if repos.Maps != nil {
		repos.Maps = NewMaps(repos.Maps, store, ttl)
	}
	if repos.Lineups != nil {
		repos.Lineups = NewLineups(repos.Lineups, store, ttl)
	}
	return repos
}
