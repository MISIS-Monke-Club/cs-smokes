package pullrequests_test

import (
	"net/http"
	"testing"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/pullrequests"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/users"
)

func TestCanModerateRequiresAdminRole(t *testing.T) {
	for _, actor := range []pullrequests.Actor{
		{UserID: 1, IsSuperuser: true},
		{UserID: 1, IsBaseAdmin: true},
	} {
		if !pullrequests.CanModerate(actor) {
			t.Fatalf("actor %#v should moderate", actor)
		}
	}
	if pullrequests.CanModerate(pullrequests.Actor{UserID: 1, IsEditor: true}) {
		t.Fatalf("editor must not approve or reject pull requests")
	}
}

func TestCanCancelAllowsCreatorOrAdmin(t *testing.T) {
	pr := pullrequests.PullRequest{ID: 1, CreatorID: 7}
	if !pullrequests.CanCancel(pullrequests.Actor{UserID: 7}, pr) {
		t.Fatalf("creator should cancel own pull request")
	}
	if !pullrequests.CanCancel(pullrequests.Actor{UserID: 2, IsBaseAdmin: true}, pr) {
		t.Fatalf("admin should cancel pull request")
	}
	if pullrequests.CanCancel(pullrequests.Actor{UserID: 2}, pr) {
		t.Fatalf("non-creator non-admin should not cancel")
	}
}

func TestCanDeleteCommentAllowsModeratorsOrOwnComment(t *testing.T) {
	comment := pullrequests.Comment{ID: 1, Creator: users.User{UserID: 7}}
	for _, actor := range []pullrequests.Actor{
		{UserID: 1, IsSuperuser: true},
		{UserID: 2, IsBaseAdmin: true},
		{UserID: 7, IsEditor: true},
		{UserID: 7},
	} {
		if !pullrequests.CanDeleteComment(actor, comment) {
			t.Fatalf("actor %#v should delete comment", actor)
		}
	}
	if pullrequests.CanDeleteComment(pullrequests.Actor{UserID: 3, IsEditor: true}, comment) {
		t.Fatalf("editor must not delete another user's comment")
	}
	if pullrequests.CanDeleteComment(pullrequests.Actor{UserID: 3}, comment) {
		t.Fatalf("non-admin must not delete another user's comment")
	}
}

func TestForbiddenWritesLegacyVisibleBody(t *testing.T) {
	status, body := pullrequests.ForbiddenBody()
	if status != http.StatusForbidden {
		t.Fatalf("status = %d", status)
	}
	if body["detail"] == "" {
		t.Fatalf("forbidden body missing detail")
	}
}
