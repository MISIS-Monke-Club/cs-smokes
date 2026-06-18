package pullrequests

import "net/http"

type Actor struct {
	UserID      int
	IsSuperuser bool
	IsBaseAdmin bool
	IsEditor    bool
}

func CanModerate(actor Actor) bool {
	return actor.IsSuperuser || actor.IsBaseAdmin
}

func CanCancel(actor Actor, pr PullRequest) bool {
	return CanModerate(actor) || actor.UserID == pr.CreatorID
}

func ForbiddenBody() (int, map[string]string) {
	return http.StatusForbidden, map[string]string{"detail": "You do not have permission to perform this action."}
}
