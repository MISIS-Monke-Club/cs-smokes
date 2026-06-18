package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/lineups"
)

const lineupsPrefix = "lineups:"

type Lineups struct {
	next  lineups.Repository
	store Store
	ttl   time.Duration
}

func NewLineups(next lineups.Repository, store Store, ttl time.Duration) Lineups {
	return Lineups{next: next, store: store, ttl: ttl}
}

func (c Lineups) ListLineups(ctx context.Context, filter lineups.Filter) ([]lineups.Lineup, error) {
	key := fmt.Sprintf("%slist:%s:%s:%s:%s", lineupsPrefix, filter.Ordering, filter.Query, filter.ByUserName, boolPtr(filter.IsApproved))
	var rows []lineups.Lineup
	if c.get(ctx, key, &rows) {
		return rows, nil
	}
	rows, err := c.next.ListLineups(ctx, filter)
	if err != nil {
		return nil, err
	}
	c.set(ctx, key, rows)
	return rows, nil
}

func (c Lineups) GetLineup(ctx context.Context, id int) (lineups.Lineup, error) {
	key := fmt.Sprintf("%sdetail:%d", lineupsPrefix, id)
	var item lineups.Lineup
	if c.get(ctx, key, &item) {
		return item, nil
	}
	item, err := c.next.GetLineup(ctx, id)
	if err != nil {
		return lineups.Lineup{}, err
	}
	c.set(ctx, key, item)
	return item, nil
}

func (c Lineups) CreateLineup(ctx context.Context, input lineups.Input) (lineups.Lineup, error) {
	item, err := c.next.CreateLineup(ctx, input)
	c.invalidate(ctx)
	return item, err
}

func (c Lineups) ReplaceLineup(ctx context.Context, id int, input lineups.Input) (lineups.Lineup, error) {
	item, err := c.next.ReplaceLineup(ctx, id, input)
	c.invalidate(ctx)
	return item, err
}

func (c Lineups) PatchLineup(ctx context.Context, id int, input lineups.Input) (lineups.Lineup, error) {
	item, err := c.next.PatchLineup(ctx, id, input)
	c.invalidate(ctx)
	return item, err
}

func (c Lineups) DeleteLineup(ctx context.Context, id int) error {
	err := c.next.DeleteLineup(ctx, id)
	c.invalidate(ctx)
	return err
}

func (c Lineups) ChangeGrenadeClass(ctx context.Context, id int, classID int) (lineups.Lineup, error) {
	item, err := c.next.ChangeGrenadeClass(ctx, id, classID)
	c.invalidate(ctx)
	return item, err
}

func (c Lineups) get(ctx context.Context, key string, target any) bool {
	if c.store == nil {
		return false
	}
	raw, err := c.store.Get(ctx, key)
	if err != nil || len(raw) == 0 {
		return false
	}
	return json.Unmarshal(raw, target) == nil
}

func (c Lineups) set(ctx context.Context, key string, value any) {
	if c.store == nil {
		return
	}
	raw, err := json.Marshal(value)
	if err != nil {
		return
	}
	_ = c.store.Set(ctx, key, raw, c.ttl)
}

func (c Lineups) invalidate(ctx context.Context) {
	if c.store != nil {
		_ = c.store.DeletePrefix(ctx, lineupsPrefix)
	}
}
