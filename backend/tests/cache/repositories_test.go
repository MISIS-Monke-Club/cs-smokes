package cache_test

import (
	"testing"
	"time"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/maps"
	cache "github.com/MISIS-Monke-Club/cs-smokes/backend/internal/platform/cache"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/platform/httpserver"
)

func TestWrapRepositoriesOnlyWrapsCacheableRepositoriesWhenStoreExists(t *testing.T) {
	mapRepo := &mapRepo{items: []maps.Map{{MapID: 1, Name: "Mirage"}}}
	repos := httpserver.Repositories{Maps: mapRepo}

	unchanged := cache.WrapRepositories(repos, nil, time.Minute)
	if unchanged.Maps != mapRepo {
		t.Fatalf("nil store changed maps repo: %#v", unchanged.Maps)
	}

	wrapped := cache.WrapRepositories(repos, newMemoryStore(), time.Minute)
	if wrapped.Maps == nil || wrapped.Maps == mapRepo {
		t.Fatalf("non-nil store did not wrap maps repo: %#v", wrapped.Maps)
	}
	if wrapped.Lineups != nil {
		t.Fatalf("nil lineups repo should stay nil: %#v", wrapped.Lineups)
	}
}
