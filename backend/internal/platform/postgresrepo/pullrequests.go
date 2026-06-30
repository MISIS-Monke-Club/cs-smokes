package postgresrepo

import (
	"context"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/db/generated"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/pullrequests"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/users"
)

type PullRequests struct {
	store *Store
}

func (r PullRequests) ListPullRequests(ctx context.Context) ([]pullrequests.PullRequest, error) {
	rows, err := r.store.q.ListPullRequests(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]pullrequests.PullRequest, 0, len(rows))
	for _, row := range rows {
		item, err := r.store.pullRequestFromRecord(ctx, row)
		if err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	return out, nil
}

func (r PullRequests) CreatePullRequest(ctx context.Context, actor pullrequests.Actor, lineupID int) (pullrequests.PullRequest, error) {
	row, err := r.store.q.CreatePullRequest(ctx, generated.CreatePullRequestParams{LineupID: int32(lineupID), CreatorID: int32(actor.UserID)})
	if err != nil {
		return pullrequests.PullRequest{}, err
	}
	return r.store.pullRequestFromRecord(ctx, row)
}

func (r PullRequests) GetPullRequest(ctx context.Context, id int) (pullrequests.PullRequest, error) {
	row, err := r.store.q.GetPullRequestByID(ctx, int32(id))
	if err != nil {
		return pullrequests.PullRequest{}, mapNotFound(err, pullrequests.ErrNotFound)
	}
	return r.store.pullRequestFromRecord(ctx, row)
}

func (r PullRequests) UpdatePullRequestStatus(ctx context.Context, id int, status string, approverID *int) (pullrequests.PullRequest, error) {
	row, err := r.store.q.UpdatePullRequestStatus(ctx, generated.UpdatePullRequestStatusParams{
		ID:         int32(id),
		Status:     status,
		ApproverID: int4Value(approverID),
	})
	if err != nil {
		return pullrequests.PullRequest{}, mapNotFound(err, pullrequests.ErrNotFound)
	}
	return r.store.pullRequestFromRecord(ctx, row)
}

func (r PullRequests) DeletePullRequest(ctx context.Context, id int) error {
	if _, err := r.store.q.GetPullRequestByID(ctx, int32(id)); err != nil {
		return mapNotFound(err, pullrequests.ErrNotFound)
	}
	return r.store.q.DeletePullRequest(ctx, int32(id))
}

func (r PullRequests) ListComments(ctx context.Context, prID int) ([]pullrequests.Comment, error) {
	return r.store.commentsByPullRequest(ctx, prID)
}

func (r PullRequests) CreateComment(ctx context.Context, prID int, actor pullrequests.Actor, text string) (pullrequests.Comment, error) {
	row, err := r.store.q.CreateComment(ctx, generated.CreateCommentParams{PullRequestID: int32(prID), AuthorID: int32(actor.UserID), Text: text})
	if err != nil {
		return pullrequests.Comment{}, err
	}
	return r.store.commentFromRecord(ctx, row)
}

func (r PullRequests) GetComment(ctx context.Context, id int) (pullrequests.Comment, error) {
	row, err := r.store.q.GetCommentByID(ctx, int32(id))
	if err != nil {
		return pullrequests.Comment{}, mapNotFound(err, pullrequests.ErrNotFound)
	}
	return r.store.commentFromRecord(ctx, row)
}

func (r PullRequests) UpdateComment(ctx context.Context, id int, text string) (pullrequests.Comment, error) {
	row, err := r.store.q.UpdateComment(ctx, generated.UpdateCommentParams{ID: int32(id), Text: text})
	if err != nil {
		return pullrequests.Comment{}, mapNotFound(err, pullrequests.ErrNotFound)
	}
	return r.store.commentFromRecord(ctx, row)
}

func (r PullRequests) DeleteComment(ctx context.Context, id int) error {
	if _, err := r.store.q.GetCommentByID(ctx, int32(id)); err != nil {
		return mapNotFound(err, pullrequests.ErrNotFound)
	}
	return r.store.q.DeleteComment(ctx, int32(id))
}

type Realtime struct {
	store *Store
}

func (r Realtime) ListComments(ctx context.Context, prID int) ([]pullrequests.Comment, error) {
	return r.store.commentsByPullRequest(ctx, prID)
}

func (r Realtime) CreateComment(ctx context.Context, prID int, actor pullrequests.Actor, text string) (pullrequests.Comment, error) {
	return PullRequests{store: r.store}.CreateComment(ctx, prID, actor, text)
}

func (r Realtime) DeleteComment(ctx context.Context, commentID int, actor pullrequests.Actor) ([]pullrequests.Comment, error) {
	comment, err := PullRequests{store: r.store}.GetComment(ctx, commentID)
	if err != nil {
		return nil, err
	}
	if !pullrequests.CanDeleteComment(actor, comment) {
		return nil, pullrequests.ErrNotFound
	}
	if err := r.store.q.DeleteComment(ctx, int32(commentID)); err != nil {
		return nil, err
	}
	return r.store.commentsByPullRequest(ctx, comment.PullRequestID)
}

func (s *Store) pullRequestFromRecord(ctx context.Context, row generated.PullRequest) (pullrequests.PullRequest, error) {
	lineup, err := s.GetLineup(ctx, int(row.LineupID))
	if err != nil {
		return pullrequests.PullRequest{}, err
	}
	creator, err := s.GetUser(ctx, int(row.CreatorID))
	if err != nil {
		return pullrequests.PullRequest{}, err
	}
	var approver *users.User
	if row.ApproverID.Valid {
		user, err := s.GetUser(ctx, int(row.ApproverID.Int32))
		if err != nil {
			return pullrequests.PullRequest{}, err
		}
		approver = &user
	}
	return pullrequests.PullRequest{
		ID:        int(row.ID),
		LineupID:  int(row.LineupID),
		Lineup:    lineup,
		Creator:   creator,
		Approver:  approver,
		Status:    row.Status,
		CreatedAt: timeString(row.CreatedAt),
		ClosedAt:  timePtrString(row.ClosedAt),
	}, nil
}

func (s *Store) commentsByPullRequest(ctx context.Context, prID int) ([]pullrequests.Comment, error) {
	rows, err := s.q.ListCommentsByPullRequest(ctx, int32(prID))
	if err != nil {
		return nil, err
	}
	out := make([]pullrequests.Comment, 0, len(rows))
	for _, row := range rows {
		item, err := s.commentFromRecord(ctx, row)
		if err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	return out, nil
}

func (s *Store) commentFromRecord(ctx context.Context, row generated.Comment) (pullrequests.Comment, error) {
	creator, err := s.GetUser(ctx, int(row.AuthorID))
	if err != nil {
		return pullrequests.Comment{}, err
	}
	return pullrequests.Comment{
		ID:            int(row.ID),
		PullRequestID: int(row.PullRequestID),
		Text:          row.Text,
		Creator:       creator,
		CreatorRole:   roleForUser(ctx, s, int(row.AuthorID)),
		CreatedAt:     timeString(row.CreatedAt),
	}, nil
}

func roleForUser(ctx context.Context, s *Store, userID int) string {
	roles, err := s.RolesForUser(ctx, userID)
	if err != nil {
		return "user"
	}
	switch {
	case roles.IsSuperuser:
		return "superuser"
	case roles.IsBaseAdmin:
		return "base_admin"
	case roles.IsEditor:
		return "editor"
	default:
		return "user"
	}
}
