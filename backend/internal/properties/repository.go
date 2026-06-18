package properties

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

type DuplicateError struct{}

func (DuplicateError) Error() string {
	return "duplicate relation"
}

type Repository interface {
	ListProperties(ctx context.Context) ([]Property, error)
	CreateProperty(ctx context.Context, input Input) (Property, error)
	GetProperty(ctx context.Context, id int) (Property, error)
	ReplaceProperty(ctx context.Context, id int, input Input) (Property, error)
	PatchProperty(ctx context.Context, id int, input Input) (Property, error)
	DeleteProperty(ctx context.Context, id int) error
	ListPropertyRelations(ctx context.Context, grenadeID *int) ([]PropertyRelation, error)
	CreateLineupProperty(ctx context.Context, grenadeID int, propertyID int) (PropertyRelation, error)
	DeleteLineupProperty(ctx context.Context, grenadeID int, propertyID int) error
}
