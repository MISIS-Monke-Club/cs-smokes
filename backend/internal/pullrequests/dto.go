package pullrequests

import (
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/lineups"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/users"
)

const (
	StatusOpen     = "OPEN"
	StatusApproved = "APPROVED"
	StatusRejected = "REJECTED"
	StatusMerged   = "MERGED"
	StatusClosed   = "CLOSED"
)

type PullRequest struct {
	ID         int
	LineupID   int
	Lineup     lineups.Lineup
	CreatorID  int
	Creator    users.User
	ApproverID *int
	Approver   *users.User
	Status     string
	CreatedAt  string
	ClosedAt   *string
}

type Comment struct {
	ID            int
	PullRequestID int
	Text          string
	Creator       users.User
	CreatorRole   string
	CreatedAt     string
}

type UserSummaryDTO struct {
	ID        int     `json:"id"`
	Username  string  `json:"username"`
	FirstName *string `json:"first_name"`
	LastName  *string `json:"last_name"`
	AvatarURL *string `json:"avatar_url"`
}

type CommentCreatorDTO struct {
	UserID    int     `json:"user_id"`
	Username  string  `json:"username"`
	AvatarURL *string `json:"avatar_url"`
	FirstName *string `json:"first_name"`
	LastName  *string `json:"last_name"`
	Role      string  `json:"role"`
}

type PullRequestDTO struct {
	ID        int               `json:"id"`
	Lineup    lineups.LineupDTO `json:"lineup"`
	Creator   UserSummaryDTO    `json:"creator"`
	Approver  *UserSummaryDTO   `json:"approver"`
	Status    string            `json:"status"`
	CreatedAt string            `json:"created_at"`
	ClosedAt  *string           `json:"closed_at"`
}

type PullRequestCreateDTO struct {
	ID       int    `json:"id"`
	LineupID int    `json:"lineup_id"`
	Status   string `json:"status"`
}

type CommentDTO struct {
	ID        int               `json:"id"`
	Text      string            `json:"text"`
	Creator   CommentCreatorDTO `json:"creator"`
	CreatedAt string            `json:"created_at"`
}

func ToDTO(baseURL string, pr PullRequest) PullRequestDTO {
	var approver *UserSummaryDTO
	if pr.Approver != nil {
		value := toUserSummary(*pr.Approver)
		approver = &value
	}
	return PullRequestDTO{
		ID:        pr.ID,
		Lineup:    lineups.ToDTO(baseURL, pr.Lineup),
		Creator:   toUserSummary(pr.Creator),
		Approver:  approver,
		Status:    pr.Status,
		CreatedAt: pr.CreatedAt,
		ClosedAt:  pr.ClosedAt,
	}
}

func ToCreateDTO(pr PullRequest) PullRequestCreateDTO {
	return PullRequestCreateDTO{ID: pr.ID, LineupID: pr.LineupID, Status: pr.Status}
}

func ToCommentDTO(comment Comment) CommentDTO {
	return CommentDTO{
		ID:   comment.ID,
		Text: comment.Text,
		Creator: CommentCreatorDTO{
			UserID:    comment.Creator.UserID,
			Username:  comment.Creator.Username,
			AvatarURL: comment.Creator.AvatarURL,
			FirstName: comment.Creator.FirstName,
			LastName:  comment.Creator.LastName,
			Role:      comment.CreatorRole,
		},
		CreatedAt: comment.CreatedAt,
	}
}

func toUserSummary(user users.User) UserSummaryDTO {
	return UserSummaryDTO{
		ID:        user.UserID,
		Username:  user.Username,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		AvatarURL: user.AvatarURL,
	}
}
