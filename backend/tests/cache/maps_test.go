package cache_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/maps"
	cache "github.com/MISIS-Monke-Club/cs-smokes/backend/internal/platform/cache"
)

func TestCachedMapsListUsesCacheAndInvalidatesOnWrite(t *testing.T) {
	store := newMemoryStore()
	repo := &mapRepo{items: []maps.Map{{MapID: 1, Name: "Mirage", IsEsportsPool: true}}}
	cached := cache.NewMaps(repo, store, time.Minute)

	first, err := cached.ListMaps(context.Background(), maps.Filter{Ordering: "by_alphabet", Query: "mirage"})
	if err != nil {
		t.Fatalf("first list: %v", err)
	}
	second, err := cached.ListMaps(context.Background(), maps.Filter{Ordering: "by_alphabet", Query: "mirage"})
	if err != nil {
		t.Fatalf("second list: %v", err)
	}
	if repo.listCalls != 1 {
		t.Fatalf("list calls = %d", repo.listCalls)
	}
	if first[0].Name != second[0].Name {
		t.Fatalf("cached result mismatch: %#v %#v", first, second)
	}

	if _, err := cached.CreateMap(context.Background(), maps.Input{Name: "Ancient"}); err != nil {
		t.Fatalf("create: %v", err)
	}
	if len(store.deletedPrefixes) == 0 {
		t.Fatalf("write did not invalidate cache prefixes")
	}
	if _, err := cached.ListMaps(context.Background(), maps.Filter{Ordering: "by_alphabet", Query: "mirage"}); err != nil {
		t.Fatalf("third list: %v", err)
	}
	if repo.listCalls != 2 {
		t.Fatalf("list calls after invalidation = %d", repo.listCalls)
	}
}

func TestCachedMapsFallsBackWhenCacheUnavailable(t *testing.T) {
	store := newMemoryStore()
	store.getErr = errors.New("redis down")
	store.setErr = errors.New("redis down")
	repo := &mapRepo{items: []maps.Map{{MapID: 1, Name: "Mirage"}}}
	cached := cache.NewMaps(repo, store, time.Minute)

	rows, err := cached.ListMaps(context.Background(), maps.Filter{})
	if err != nil {
		t.Fatalf("list with cache outage: %v", err)
	}
	if len(rows) != 1 || rows[0].Name != "Mirage" {
		t.Fatalf("rows = %#v", rows)
	}
	if repo.listCalls != 1 {
		t.Fatalf("list calls = %d", repo.listCalls)
	}
}

type mapRepo struct {
	items     []maps.Map
	listCalls int
}

func (r *mapRepo) ListMaps(_ context.Context, _ maps.Filter) ([]maps.Map, error) {
	r.listCalls++
	return r.items, nil
}

func (r *mapRepo) CreateMap(_ context.Context, input maps.Input) (maps.Map, error) {
	item := maps.Map{MapID: len(r.items) + 1, Name: input.Name}
	r.items = append(r.items, item)
	return item, nil
}

func (r *mapRepo) GetMap(_ context.Context, id int) (maps.Map, error) {
	for _, item := range r.items {
		if item.MapID == id {
			return item, nil
		}
	}
	return maps.Map{}, maps.ErrNotFound
}

func (r *mapRepo) ReplaceMap(ctx context.Context, id int, input maps.Input) (maps.Map, error) {
	return r.PatchMap(ctx, id, input)
}

func (r *mapRepo) PatchMap(_ context.Context, id int, input maps.Input) (maps.Map, error) {
	for index, item := range r.items {
		if item.MapID == id {
			item.Name = input.Name
			r.items[index] = item
			return item, nil
		}
	}
	return maps.Map{}, maps.ErrNotFound
}

func (r *mapRepo) DeleteMap(_ context.Context, id int) error {
	for index, item := range r.items {
		if item.MapID == id {
			r.items = append(r.items[:index], r.items[index+1:]...)
			return nil
		}
	}
	return maps.ErrNotFound
}
