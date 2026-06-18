package realtime

import (
	"context"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/pullrequests"
)

type Repository interface {
	ListComments(ctx context.Context, prID int) ([]pullrequests.Comment, error)
	CreateComment(ctx context.Context, prID int, actor pullrequests.Actor, text string) (pullrequests.Comment, error)
	DeleteComment(ctx context.Context, commentID int, actor pullrequests.Actor) ([]pullrequests.Comment, error)
}
