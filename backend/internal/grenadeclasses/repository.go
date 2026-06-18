package grenadeclasses

import (
	"context"
	"errors"
)

var ErrNotFound = errors.New("not found")

type Repository interface {
	ListGrenadeClasses(ctx context.Context) ([]GrenadeClass, error)
	CreateGrenadeClass(ctx context.Context, input Input) (GrenadeClass, error)
	GetGrenadeClass(ctx context.Context, id int) (GrenadeClass, error)
	ReplaceGrenadeClass(ctx context.Context, id int, input Input) (GrenadeClass, error)
	PatchGrenadeClass(ctx context.Context, id int, input Input) (GrenadeClass, error)
	DeleteGrenadeClass(ctx context.Context, id int) error
}
