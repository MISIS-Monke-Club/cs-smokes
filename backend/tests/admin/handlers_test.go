package admin_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/admin"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/auth"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/grenadeclasses"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/lineups"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/pullrequests"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/users"
	"github.com/go-chi/chi/v5"
)

func TestAdminRoutesDenyAnonymousAndNonAdminFromDatabaseRoles(t *testing.T) {
	repo := newAdminRepo()
	router := newRouter(repo, actorFromHeader)

	for _, tc := range []struct {
		name  string
		actor string
		want  int
	}{
		{name: "anonymous", actor: "", want: http.StatusUnauthorized},
		{name: "non-admin", actor: "player", want: http.StatusForbidden},
		{name: "client role claim ignored", actor: "forged-editor", want: http.StatusForbidden},
		{name: "editor", actor: "editor", want: http.StatusOK},
	} {
		t.Run(tc.name, func(t *testing.T) {
			resp := perform(router, http.MethodGet, "/api/admin/me", "", tc.actor)
			if resp.Code != tc.want {
				t.Fatalf("status = %d, want %d, body = %s", resp.Code, tc.want, resp.Body.String())
			}
		})
	}
}

func TestAdminUserRoleMatrix(t *testing.T) {
	repo := newAdminRepo()
	router := newRouter(repo, actorFromHeader)

	if resp := perform(router, http.MethodGet, "/api/admin/users", "", "editor"); resp.Code != http.StatusForbidden {
		t.Fatalf("editor list users status = %d, body = %s", resp.Code, resp.Body.String())
	}
	if resp := perform(router, http.MethodGet, "/api/admin/users", "", "base"); resp.Code != http.StatusOK {
		t.Fatalf("base list users status = %d, body = %s", resp.Code, resp.Body.String())
	}
	if resp := perform(router, http.MethodPut, "/api/admin/users/7/roles", `{"roles":["editor"]}`, "base"); resp.Code != http.StatusForbidden {
		t.Fatalf("base grant roles status = %d, body = %s", resp.Code, resp.Body.String())
	}
	if resp := perform(router, http.MethodPut, "/api/admin/users/7/roles", `{"roles":["editor"]}`, "super"); resp.Code != http.StatusOK {
		t.Fatalf("super grant roles status = %d, body = %s", resp.Code, resp.Body.String())
	}
	if !repo.rolesByUser[7].IsEditor {
		t.Fatalf("roles were not updated: %#v", repo.rolesByUser[7])
	}
	if resp := perform(router, http.MethodDelete, "/api/admin/users/7", "", "base"); resp.Code != http.StatusForbidden {
		t.Fatalf("base delete user status = %d, body = %s", resp.Code, resp.Body.String())
	}
	if resp := perform(router, http.MethodDelete, "/api/admin/users/7", "", "super"); resp.Code != http.StatusNoContent {
		t.Fatalf("super delete user status = %d, body = %s", resp.Code, resp.Body.String())
	}
}

func TestAdminPullRequestAndCommentPermissions(t *testing.T) {
	repo := newAdminRepo()
	router := newRouter(repo, actorFromHeader)

	if resp := perform(router, http.MethodGet, "/api/admin/pull_requests?status=OPEN", "", "editor"); resp.Code != http.StatusOK {
		t.Fatalf("editor list PRs status = %d, body = %s", resp.Code, resp.Body.String())
	}
	if resp := perform(router, http.MethodPatch, "/api/admin/pull_requests/1/approve", "", "editor"); resp.Code != http.StatusForbidden {
		t.Fatalf("editor approve status = %d, body = %s", resp.Code, resp.Body.String())
	}
	if resp := perform(router, http.MethodPatch, "/api/admin/pull_requests/1/approve", "", "base"); resp.Code != http.StatusOK {
		t.Fatalf("base approve status = %d, body = %s", resp.Code, resp.Body.String())
	}
	if resp := perform(router, http.MethodPost, "/api/admin/pull_requests/1/comments", `{"text":"needs another angle"}`, "editor"); resp.Code != http.StatusCreated {
		t.Fatalf("editor create comment status = %d, body = %s", resp.Code, resp.Body.String())
	}
	createdID := repo.nextComment - 1
	if resp := perform(router, http.MethodDelete, "/api/admin/comments/1", "", "editor"); resp.Code != http.StatusForbidden {
		t.Fatalf("editor delete another comment status = %d, body = %s", resp.Code, resp.Body.String())
	}
	if resp := perform(router, http.MethodDelete, "/api/admin/comments/"+itoa(createdID), "", "editor"); resp.Code != http.StatusNoContent {
		t.Fatalf("editor delete own comment status = %d, body = %s", resp.Code, resp.Body.String())
	}
	if resp := perform(router, http.MethodDelete, "/api/admin/comments/2", "", "base"); resp.Code != http.StatusNoContent {
		t.Fatalf("base delete comment status = %d, body = %s", resp.Code, resp.Body.String())
	}
}

func newRouter(repo *fakeAdminRepo, actor admin.ActorFunc) http.Handler {
	router := chi.NewRouter()
	admin.RegisterRoutes(router, admin.NewHandler(repo, repo, repo, actor))
	return router
}

type fakeAdminRepo struct {
	users       map[int]users.User
	rolesByUser map[int]auth.RoleSet
	requests    map[int]pullrequests.PullRequest
	comments    map[int]pullrequests.Comment
	nextComment int
}

func newAdminRepo() *fakeAdminRepo {
	lineup := lineups.Lineup{
		UserID:       7,
		GrenadeID:    1,
		MapID:        1,
		Creator:      users.User{UserID: 7, Username: "creator"},
		CreatedAt:    "2026-01-01T00:00:00Z",
		Title:        "Window smoke",
		IsApproved:   true,
		GrenadeClass: grenadeclasses.GrenadeClass{GrenadeClassID: 1, Name: "Smoke", Price: 300},
	}
	return &fakeAdminRepo{
		nextComment: 3,
		users: map[int]users.User{
			2: {UserID: 2, Username: "super"},
			3: {UserID: 3, Username: "base"},
			4: {UserID: 4, Username: "editor"},
			7: {UserID: 7, Username: "player"},
			8: {UserID: 8, Username: "forged"},
		},
		rolesByUser: map[int]auth.RoleSet{
			2: {IsSuperuser: true},
			3: {IsBaseAdmin: true},
			4: {IsEditor: true},
		},
		requests: map[int]pullrequests.PullRequest{
			1: {ID: 1, LineupID: 1, Lineup: lineup, CreatorID: 7, Creator: users.User{UserID: 7, Username: "creator"}, Status: pullrequests.StatusOpen, CreatedAt: "2026-01-02T00:00:00Z"},
			2: {ID: 2, LineupID: 1, Lineup: lineup, CreatorID: 7, Creator: users.User{UserID: 7, Username: "creator"}, Status: pullrequests.StatusClosed, CreatedAt: "2026-01-03T00:00:00Z"},
		},
		comments: map[int]pullrequests.Comment{
			1: {ID: 1, PullRequestID: 1, Text: "creator", Creator: users.User{UserID: 7, Username: "creator"}, CreatorRole: "creator", CreatedAt: "2026-01-02T00:00:00Z"},
			2: {ID: 2, PullRequestID: 1, Text: "base", Creator: users.User{UserID: 3, Username: "base"}, CreatorRole: "base_admin", CreatedAt: "2026-01-03T00:00:00Z"},
		},
	}
}

func (r *fakeAdminRepo) RolesForUser(_ context.Context, userID int) (auth.RoleSet, error) {
	return r.rolesByUser[userID], nil
}

func (r *fakeAdminRepo) SetUserRoles(_ context.Context, userID int, roles auth.RoleSet) error {
	r.rolesByUser[userID] = roles
	return nil
}

func (r *fakeAdminRepo) ListUsers(context.Context) ([]users.User, error) {
	return []users.User{r.users[7]}, nil
}

func (r *fakeAdminRepo) CreateUser(context.Context, users.UserInput) (users.User, error) {
	return users.User{}, users.ErrNotFound
}

func (r *fakeAdminRepo) GetUser(_ context.Context, id int) (users.User, error) {
	item, ok := r.users[id]
	if !ok {
		return users.User{}, users.ErrNotFound
	}
	return item, nil
}

func (r *fakeAdminRepo) ReplaceUser(context.Context, int, users.UserInput) (users.User, error) {
	return users.User{}, users.ErrNotFound
}

func (r *fakeAdminRepo) PatchUser(_ context.Context, id int, input users.UserInput) (users.User, error) {
	item, ok := r.users[id]
	if !ok {
		return users.User{}, users.ErrNotFound
	}
	if input.FirstName != nil {
		item.FirstName = input.FirstName
	}
	r.users[id] = item
	return item, nil
}

func (r *fakeAdminRepo) DeleteUser(_ context.Context, id int) error {
	if _, ok := r.users[id]; !ok {
		return users.ErrNotFound
	}
	delete(r.users, id)
	return nil
}

func (r *fakeAdminRepo) ListPullRequests(context.Context) ([]pullrequests.PullRequest, error) {
	return []pullrequests.PullRequest{r.requests[1], r.requests[2]}, nil
}

func (r *fakeAdminRepo) CreatePullRequest(context.Context, pullrequests.Actor, int) (pullrequests.PullRequest, error) {
	return pullrequests.PullRequest{}, pullrequests.ErrNotFound
}

func (r *fakeAdminRepo) GetPullRequest(_ context.Context, id int) (pullrequests.PullRequest, error) {
	item, ok := r.requests[id]
	if !ok {
		return pullrequests.PullRequest{}, pullrequests.ErrNotFound
	}
	return item, nil
}

func (r *fakeAdminRepo) UpdatePullRequestStatus(_ context.Context, id int, status string, approverID *int) (pullrequests.PullRequest, error) {
	item, ok := r.requests[id]
	if !ok {
		return pullrequests.PullRequest{}, pullrequests.ErrNotFound
	}
	item.Status = status
	item.ApproverID = approverID
	r.requests[id] = item
	return item, nil
}

func (r *fakeAdminRepo) DeletePullRequest(context.Context, int) error {
	return pullrequests.ErrNotFound
}

func (r *fakeAdminRepo) ListComments(_ context.Context, prID int) ([]pullrequests.Comment, error) {
	var out []pullrequests.Comment
	for _, comment := range r.comments {
		if comment.PullRequestID == prID {
			out = append(out, comment)
		}
	}
	return out, nil
}

func (r *fakeAdminRepo) CreateComment(_ context.Context, prID int, actor pullrequests.Actor, text string) (pullrequests.Comment, error) {
	item := pullrequests.Comment{ID: r.nextComment, PullRequestID: prID, Text: text, Creator: users.User{UserID: actor.UserID, Username: "actor"}, CreatorRole: "editor", CreatedAt: "2026-01-04T00:00:00Z"}
	r.comments[item.ID] = item
	r.nextComment++
	return item, nil
}

func (r *fakeAdminRepo) GetComment(_ context.Context, id int) (pullrequests.Comment, error) {
	item, ok := r.comments[id]
	if !ok {
		return pullrequests.Comment{}, pullrequests.ErrNotFound
	}
	return item, nil
}

func (r *fakeAdminRepo) UpdateComment(context.Context, int, string) (pullrequests.Comment, error) {
	return pullrequests.Comment{}, pullrequests.ErrNotFound
}

func (r *fakeAdminRepo) DeleteComment(_ context.Context, id int) error {
	if _, ok := r.comments[id]; !ok {
		return pullrequests.ErrNotFound
	}
	delete(r.comments, id)
	return nil
}

func actorFromHeader(r *http.Request) (admin.Actor, bool) {
	switch r.Header.Get("X-Test-Actor") {
	case "super":
		return admin.Actor{UserID: 2}, true
	case "base":
		return admin.Actor{UserID: 3}, true
	case "editor":
		return admin.Actor{UserID: 4}, true
	case "player":
		return admin.Actor{UserID: 7}, true
	case "forged-editor":
		return admin.Actor{UserID: 8, Claims: auth.RoleSet{IsEditor: true}}, true
	default:
		return admin.Actor{}, false
	}
}

func perform(handler http.Handler, method string, path string, body string, actor string) *httptest.ResponseRecorder {
	request := httptest.NewRequest(method, path, strings.NewReader(body))
	request.Host = "example.com"
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("X-Test-Actor", actor)
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, request)
	return recorder
}

func itoa(value int) string {
	return strconv.Itoa(value)
}

var _ admin.RoleRepository = (*fakeAdminRepo)(nil)
var _ admin.UserRepository = (*fakeAdminRepo)(nil)
var _ admin.PullRequestRepository = (*fakeAdminRepo)(nil)
