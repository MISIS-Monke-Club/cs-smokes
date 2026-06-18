package users

import (
	"context"
	"errors"
	"strings"
)

var ErrNotFound = errors.New("not found")

type DuplicateError struct {
	Fields []string
}

func (e DuplicateError) Error() string {
	return "duplicate " + strings.Join(e.Fields, ", ")
}

type Repository interface {
	ListUsers(ctx context.Context) ([]User, error)
	CreateUser(ctx context.Context, input UserInput) (User, error)
	GetUser(ctx context.Context, id int) (User, error)
	ReplaceUser(ctx context.Context, id int, input UserInput) (User, error)
	PatchUser(ctx context.Context, id int, input UserInput) (User, error)
	DeleteUser(ctx context.Context, id int) error
}
