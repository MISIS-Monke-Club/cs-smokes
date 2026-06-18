package favorites

import (
	"context"
	"errors"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/lineups"
)

var ErrNotFound = errors.New("not found")

type DuplicateError struct{}

func (DuplicateError) Error() string {
	return "duplicate favorite"
}

type Repository interface {
	CreateFavorite(ctx context.Context, userID int, grenadeID int) (FavoriteCreateResponse, error)
	ListFavoritesByUser(ctx context.Context, userID int) ([]lineups.Lineup, error)
	DeleteFavorite(ctx context.Context, userID int, grenadeID int) error
}
