package cache_test

import (
	"context"
	"testing"
	"time"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/lineups"
	cache "github.com/MISIS-Monke-Club/cs-smokes/backend/internal/platform/cache"
)

func TestCachedLineupsListUsesCacheAndInvalidatesOnWrite(t *testing.T) {
	store := newMemoryStore()
	repo := &lineupRepo{items: []lineups.Lineup{{GrenadeID: 1, Title: "Window smoke", MapID: 2}}}
	cached := cache.NewLineups(repo, store, time.Minute)

	if _, err := cached.ListLineups(context.Background(), lineups.Filter{Ordering: "-date_of_creation", Query: "window"}); err != nil {
		t.Fatalf("first list: %v", err)
	}
	if _, err := cached.ListLineups(context.Background(), lineups.Filter{Ordering: "-date_of_creation", Query: "window"}); err != nil {
		t.Fatalf("second list: %v", err)
	}
	if repo.listCalls != 1 {
		t.Fatalf("list calls = %d", repo.listCalls)
	}

	if _, err := cached.PatchLineup(context.Background(), 1, lineups.Input{Title: "Connector smoke"}); err != nil {
		t.Fatalf("patch: %v", err)
	}
	if len(store.deletedPrefixes) == 0 {
		t.Fatalf("write did not invalidate cache prefixes")
	}
	if _, err := cached.ListLineups(context.Background(), lineups.Filter{Ordering: "-date_of_creation", Query: "window"}); err != nil {
		t.Fatalf("third list: %v", err)
	}
	if repo.listCalls != 2 {
		t.Fatalf("list calls after invalidation = %d", repo.listCalls)
	}
}

type lineupRepo struct {
	items     []lineups.Lineup
	listCalls int
}

func (r *lineupRepo) ListLineups(_ context.Context, _ lineups.Filter) ([]lineups.Lineup, error) {
	r.listCalls++
	return r.items, nil
}

func (r *lineupRepo) CreateLineup(_ context.Context, input lineups.Input) (lineups.Lineup, error) {
	item := lineups.Lineup{GrenadeID: len(r.items) + 1, Title: input.Title}
	r.items = append(r.items, item)
	return item, nil
}

func (r *lineupRepo) GetLineup(_ context.Context, id int) (lineups.Lineup, error) {
	for _, item := range r.items {
		if item.GrenadeID == id {
			return item, nil
		}
	}
	return lineups.Lineup{}, lineups.ErrNotFound
}

func (r *lineupRepo) ReplaceLineup(ctx context.Context, id int, input lineups.Input) (lineups.Lineup, error) {
	return r.PatchLineup(ctx, id, input)
}

func (r *lineupRepo) PatchLineup(_ context.Context, id int, input lineups.Input) (lineups.Lineup, error) {
	for index, item := range r.items {
		if item.GrenadeID == id {
			item.Title = input.Title
			r.items[index] = item
			return item, nil
		}
	}
	return lineups.Lineup{}, lineups.ErrNotFound
}

func (r *lineupRepo) DeleteLineup(_ context.Context, id int) error {
	for index, item := range r.items {
		if item.GrenadeID == id {
			r.items = append(r.items[:index], r.items[index+1:]...)
			return nil
		}
	}
	return lineups.ErrNotFound
}

func (r *lineupRepo) ChangeGrenadeClass(ctx context.Context, id int, _ int) (lineups.Lineup, error) {
	return r.GetLineup(ctx, id)
}
