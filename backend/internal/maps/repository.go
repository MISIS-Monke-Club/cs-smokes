package maps

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
	ListMaps(ctx context.Context, filter Filter) ([]Map, error)
	CreateMap(ctx context.Context, input Input) (Map, error)
	GetMap(ctx context.Context, id int) (Map, error)
	ReplaceMap(ctx context.Context, id int, input Input) (Map, error)
	PatchMap(ctx context.Context, id int, input Input) (Map, error)
	DeleteMap(ctx context.Context, id int) error
}
