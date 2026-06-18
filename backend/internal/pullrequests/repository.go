package pullrequests

import (
	"context"
	"errors"
)

var ErrNotFound = errors.New("not found")

type Repository interface {
	ListPullRequests(ctx context.Context) ([]PullRequest, error)
	CreatePullRequest(ctx context.Context, actor Actor, lineupID int) (PullRequest, error)
	GetPullRequest(ctx context.Context, id int) (PullRequest, error)
	UpdatePullRequestStatus(ctx context.Context, id int, status string, approverID *int) (PullRequest, error)
	DeletePullRequest(ctx context.Context, id int) error
	ListComments(ctx context.Context, prID int) ([]Comment, error)
	CreateComment(ctx context.Context, prID int, actor Actor, text string) (Comment, error)
	GetComment(ctx context.Context, id int) (Comment, error)
	UpdateComment(ctx context.Context, id int, text string) (Comment, error)
	DeleteComment(ctx context.Context, id int) error
}
