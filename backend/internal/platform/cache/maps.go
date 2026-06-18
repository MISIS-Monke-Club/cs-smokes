package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/maps"
)

const mapsPrefix = "maps:"

type Maps struct {
	next  maps.Repository
	store Store
	ttl   time.Duration
}

func NewMaps(next maps.Repository, store Store, ttl time.Duration) Maps {
	return Maps{next: next, store: store, ttl: ttl}
}

func (c Maps) ListMaps(ctx context.Context, filter maps.Filter) ([]maps.Map, error) {
	key := fmt.Sprintf("%slist:%s:%s:%v", mapsPrefix, filter.Ordering, filter.Query, boolPtr(filter.IsEsportsPool))
	var rows []maps.Map
	if c.get(ctx, key, &rows) {
		return rows, nil
	}
	rows, err := c.next.ListMaps(ctx, filter)
	if err != nil {
		return nil, err
	}
	c.set(ctx, key, rows)
	return rows, nil
}

func (c Maps) GetMap(ctx context.Context, id int) (maps.Map, error) {
	key := fmt.Sprintf("%sdetail:%d", mapsPrefix, id)
	var item maps.Map
	if c.get(ctx, key, &item) {
		return item, nil
	}
	item, err := c.next.GetMap(ctx, id)
	if err != nil {
		return maps.Map{}, err
	}
	c.set(ctx, key, item)
	return item, nil
}

func (c Maps) CreateMap(ctx context.Context, input maps.Input) (maps.Map, error) {
	item, err := c.next.CreateMap(ctx, input)
	c.invalidate(ctx)
	return item, err
}

func (c Maps) ReplaceMap(ctx context.Context, id int, input maps.Input) (maps.Map, error) {
	item, err := c.next.ReplaceMap(ctx, id, input)
	c.invalidate(ctx)
	return item, err
}

func (c Maps) PatchMap(ctx context.Context, id int, input maps.Input) (maps.Map, error) {
	item, err := c.next.PatchMap(ctx, id, input)
	c.invalidate(ctx)
	return item, err
}

func (c Maps) DeleteMap(ctx context.Context, id int) error {
	err := c.next.DeleteMap(ctx, id)
	c.invalidate(ctx)
	return err
}

func (c Maps) get(ctx context.Context, key string, target any) bool {
	if c.store == nil {
		return false
	}
	raw, err := c.store.Get(ctx, key)
	if err != nil || len(raw) == 0 {
		return false
	}
	return json.Unmarshal(raw, target) == nil
}

func (c Maps) set(ctx context.Context, key string, value any) {
	if c.store == nil {
		return
	}
	raw, err := json.Marshal(value)
	if err != nil {
		return
	}
	_ = c.store.Set(ctx, key, raw, c.ttl)
}

func (c Maps) invalidate(ctx context.Context) {
	if c.store != nil {
		_ = c.store.DeletePrefix(ctx, mapsPrefix)
	}
}

func boolPtr(value *bool) string {
	if value == nil {
		return ""
	}
	if *value {
		return "true"
	}
	return "false"
}
