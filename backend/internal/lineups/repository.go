package lineups

import (
	"context"
	"errors"
	"strings"
)

var ErrNotFound = errors.New("not found")

type ValidationError struct {
	Fields []string
}

func (e ValidationError) Error() string {
	return "invalid " + strings.Join(e.Fields, ", ")
}

type Repository interface {
	ListLineups(ctx context.Context, filter Filter) ([]Lineup, error)
	CreateLineup(ctx context.Context, input Input) (Lineup, error)
	GetLineup(ctx context.Context, id int) (Lineup, error)
	ReplaceLineup(ctx context.Context, id int, input Input) (Lineup, error)
	PatchLineup(ctx context.Context, id int, input Input) (Lineup, error)
	DeleteLineup(ctx context.Context, id int) error
	ChangeGrenadeClass(ctx context.Context, id int, classID int) (Lineup, error)
}
