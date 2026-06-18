package httpserver_test

import (
	"bytes"
	"context"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/auth"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/config"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/favorites"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/grenadeclasses"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/lineups"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/maps"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/platform/httpserver"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/pullrequests"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/users"
)

func TestServerUsesInjectedRepositories(t *testing.T) {
	server := httpserver.NewWithRepositories(
		config.Config{HTTPAddr: ":8000"},
		httpserver.Repositories{
			Users:          fakeUsersRepo{},
			GrenadeClasses: fakeGrenadeClassesRepo{},
		},
	)

	for _, tc := range []struct {
		path string
		key  string
	}{
		{path: "/api/users", key: "user_id"},
		{path: "/api/grenade-classes", key: "grenade_class_id"},
	} {
		t.Run(tc.path, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodGet, tc.path, nil)
			recorder := httptest.NewRecorder()

			server.Handler.ServeHTTP(recorder, request)

			if recorder.Code != http.StatusOK {
				t.Fatalf("status = %d, body = %s", recorder.Code, recorder.Body.String())
			}
			var body []map[string]any
			if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
				t.Fatalf("decode %q: %v", recorder.Body.String(), err)
			}
			if len(body) != 1 || body[0][tc.key] == nil {
				t.Fatalf("unexpected body: %#v", body)
			}
		})
	}
}

func TestServerAdminContentRoutesRequireDatabaseAdminRole(t *testing.T) {
	roles := &fakeAdminRoles{roles: map[int]auth.RoleSet{42: {IsEditor: true}}}
	mapRepo := &fakeMapsRepo{}
	server := httpserver.NewWithRepositories(
		config.Config{HTTPAddr: ":8000", SecretKey: "secret"},
		httpserver.Repositories{AdminRoles: roles, Maps: mapRepo},
	)
	token := mustToken(t, auth.UserClaims{UserID: 42, Username: "editor"})
	request, contentType := multipartRequest(t, "/api/admin/maps", map[string]string{"name": "Cache"})
	request.Header.Set("Authorization", "Bearer "+token)
	request.Header.Set("Content-Type", contentType)
	recorder := httptest.NewRecorder()

	server.Handler.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusCreated {
		t.Fatalf("editor create map status = %d, body = %s", recorder.Code, recorder.Body.String())
	}
	if mapRepo.createdName != "Cache" {
		t.Fatalf("created map name = %q", mapRepo.createdName)
	}
	roles.roles[42] = auth.RoleSet{}
	request, contentType = multipartRequest(t, "/api/admin/maps", map[string]string{"name": "Cache"})
	request.Header.Set("Authorization", "Bearer "+token)
	request.Header.Set("Content-Type", contentType)
	recorder = httptest.NewRecorder()
	server.Handler.ServeHTTP(recorder, request)
	if recorder.Code != http.StatusForbidden {
		t.Fatalf("non-admin create map status = %d, body = %s", recorder.Code, recorder.Body.String())
	}
}

func TestServerCurrentUserUsesBearerAccessToken(t *testing.T) {
	repo := &fakeFavoritesRepo{}
	server := httpserver.NewWithRepositories(
		config.Config{HTTPAddr: ":8000", SecretKey: "secret"},
		httpserver.Repositories{Favorites: repo},
	)
	pair, err := auth.IssueTokenPair("secret", auth.UserClaims{UserID: 42, Username: "player"})
	if err != nil {
		t.Fatalf("issue token: %v", err)
	}
	request := httptest.NewRequest(http.MethodPost, "/api/favorites", strings.NewReader(`{"grenade_id":7}`))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", "Bearer "+pair.AccessToken)
	recorder := httptest.NewRecorder()

	server.Handler.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusCreated {
		t.Fatalf("status = %d, body = %s", recorder.Code, recorder.Body.String())
	}
	if repo.userID != 42 || repo.grenadeID != 7 {
		t.Fatalf("favorite args = user %d grenade %d", repo.userID, repo.grenadeID)
	}
}

func TestServerAdminRoutesUseDatabaseRolesInsteadOfJWTClaims(t *testing.T) {
	roles := &fakeAdminRoles{roles: map[int]auth.RoleSet{}}
	server := httpserver.NewWithRepositories(
		config.Config{HTTPAddr: ":8000", SecretKey: "secret"},
		httpserver.Repositories{AdminRoles: roles, Users: fakeUsersRepo{}, PullRequests: fakePullRequestsRepo{}},
	)
	pair, err := auth.IssueTokenPair("secret", auth.UserClaims{UserID: 42, Username: "claimed-editor", IsEditor: true})
	if err != nil {
		t.Fatalf("issue token: %v", err)
	}
	request := httptest.NewRequest(http.MethodGet, "/api/admin/me", nil)
	request.Header.Set("Authorization", "Bearer "+pair.AccessToken)
	recorder := httptest.NewRecorder()

	server.Handler.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusForbidden {
		t.Fatalf("forged role status = %d, body = %s", recorder.Code, recorder.Body.String())
	}
	roles.roles[42] = auth.RoleSet{IsEditor: true}
	recorder = httptest.NewRecorder()
	server.Handler.ServeHTTP(recorder, request)
	if recorder.Code != http.StatusOK || !strings.Contains(recorder.Body.String(), "editor") {
		t.Fatalf("database role status/body = %d/%s", recorder.Code, recorder.Body.String())
	}
}

type fakeUsersRepo struct{}

func (fakeUsersRepo) ListUsers(context.Context) ([]users.User, error) {
	return []users.User{{UserID: 1, Username: "player"}}, nil
}

func (fakeUsersRepo) CreateUser(context.Context, users.UserInput) (users.User, error) {
	return users.User{}, users.ErrNotFound
}

func (fakeUsersRepo) GetUser(context.Context, int) (users.User, error) {
	return users.User{}, users.ErrNotFound
}

func (fakeUsersRepo) ReplaceUser(context.Context, int, users.UserInput) (users.User, error) {
	return users.User{}, users.ErrNotFound
}

func (fakeUsersRepo) PatchUser(context.Context, int, users.UserInput) (users.User, error) {
	return users.User{}, users.ErrNotFound
}

func (fakeUsersRepo) DeleteUser(context.Context, int) error {
	return users.ErrNotFound
}

type fakeGrenadeClassesRepo struct{}

func (fakeGrenadeClassesRepo) ListGrenadeClasses(context.Context) ([]grenadeclasses.GrenadeClass, error) {
	return []grenadeclasses.GrenadeClass{{GrenadeClassID: 1, Name: "Smoke", Price: 300}}, nil
}

func (fakeGrenadeClassesRepo) CreateGrenadeClass(context.Context, grenadeclasses.Input) (grenadeclasses.GrenadeClass, error) {
	return grenadeclasses.GrenadeClass{}, grenadeclasses.ErrNotFound
}

func (fakeGrenadeClassesRepo) GetGrenadeClass(context.Context, int) (grenadeclasses.GrenadeClass, error) {
	return grenadeclasses.GrenadeClass{}, grenadeclasses.ErrNotFound
}

func (fakeGrenadeClassesRepo) ReplaceGrenadeClass(context.Context, int, grenadeclasses.Input) (grenadeclasses.GrenadeClass, error) {
	return grenadeclasses.GrenadeClass{}, grenadeclasses.ErrNotFound
}

func (fakeGrenadeClassesRepo) PatchGrenadeClass(context.Context, int, grenadeclasses.Input) (grenadeclasses.GrenadeClass, error) {
	return grenadeclasses.GrenadeClass{}, grenadeclasses.ErrNotFound
}

func (fakeGrenadeClassesRepo) DeleteGrenadeClass(context.Context, int) error {
	return grenadeclasses.ErrNotFound
}

type fakeFavoritesRepo struct {
	userID    int
	grenadeID int
}

type fakeMapsRepo struct {
	createdName string
}

func (r *fakeMapsRepo) ListMaps(context.Context, maps.Filter) ([]maps.Map, error) {
	return []maps.Map{{MapID: 1, Name: "Mirage"}}, nil
}

func (r *fakeMapsRepo) CreateMap(_ context.Context, input maps.Input) (maps.Map, error) {
	r.createdName = input.Name
	return maps.Map{MapID: 9, Name: input.Name}, nil
}

func (r *fakeMapsRepo) GetMap(context.Context, int) (maps.Map, error) {
	return maps.Map{}, maps.ErrNotFound
}

func (r *fakeMapsRepo) ReplaceMap(context.Context, int, maps.Input) (maps.Map, error) {
	return maps.Map{}, maps.ErrNotFound
}

func (r *fakeMapsRepo) PatchMap(context.Context, int, maps.Input) (maps.Map, error) {
	return maps.Map{}, maps.ErrNotFound
}

func (r *fakeMapsRepo) DeleteMap(context.Context, int) error {
	return maps.ErrNotFound
}

func mustToken(t *testing.T, claims auth.UserClaims) string {
	t.Helper()
	pair, err := auth.IssueTokenPair("secret", claims)
	if err != nil {
		t.Fatalf("issue token: %v", err)
	}
	return pair.AccessToken
}

func multipartRequest(t *testing.T, path string, fields map[string]string) (*http.Request, string) {
	t.Helper()
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	for key, value := range fields {
		if err := writer.WriteField(key, value); err != nil {
			t.Fatalf("write field: %v", err)
		}
	}
	if err := writer.Close(); err != nil {
		t.Fatalf("close multipart: %v", err)
	}
	return httptest.NewRequest(http.MethodPost, path, &body), writer.FormDataContentType()
}

type fakeAdminRoles struct {
	roles map[int]auth.RoleSet
}

func (r *fakeAdminRoles) RolesForUser(_ context.Context, userID int) (auth.RoleSet, error) {
	return r.roles[userID], nil
}

func (r *fakeAdminRoles) SetUserRoles(_ context.Context, userID int, roles auth.RoleSet) error {
	r.roles[userID] = roles
	return nil
}

type fakePullRequestsRepo struct{}

func (fakePullRequestsRepo) ListPullRequests(context.Context) ([]pullrequests.PullRequest, error) {
	return nil, nil
}

func (fakePullRequestsRepo) CreatePullRequest(context.Context, pullrequests.Actor, int) (pullrequests.PullRequest, error) {
	return pullrequests.PullRequest{}, pullrequests.ErrNotFound
}

func (fakePullRequestsRepo) GetPullRequest(context.Context, int) (pullrequests.PullRequest, error) {
	return pullrequests.PullRequest{}, pullrequests.ErrNotFound
}

func (fakePullRequestsRepo) UpdatePullRequestStatus(context.Context, int, string, *int) (pullrequests.PullRequest, error) {
	return pullrequests.PullRequest{}, pullrequests.ErrNotFound
}

func (fakePullRequestsRepo) DeletePullRequest(context.Context, int) error {
	return pullrequests.ErrNotFound
}

func (fakePullRequestsRepo) ListComments(context.Context, int) ([]pullrequests.Comment, error) {
	return nil, nil
}

func (fakePullRequestsRepo) CreateComment(context.Context, int, pullrequests.Actor, string) (pullrequests.Comment, error) {
	return pullrequests.Comment{}, pullrequests.ErrNotFound
}

func (fakePullRequestsRepo) GetComment(context.Context, int) (pullrequests.Comment, error) {
	return pullrequests.Comment{}, pullrequests.ErrNotFound
}

func (fakePullRequestsRepo) UpdateComment(context.Context, int, string) (pullrequests.Comment, error) {
	return pullrequests.Comment{}, pullrequests.ErrNotFound
}

func (fakePullRequestsRepo) DeleteComment(context.Context, int) error {
	return pullrequests.ErrNotFound
}

func (r *fakeFavoritesRepo) CreateFavorite(_ context.Context, userID int, grenadeID int) (favorites.FavoriteCreateResponse, error) {
	r.userID = userID
	r.grenadeID = grenadeID
	return favorites.FavoriteCreateResponse{UserID: userID, GrenadeID: grenadeID}, nil
}

func (*fakeFavoritesRepo) ListFavoritesByUser(context.Context, int) ([]lineups.Lineup, error) {
	return nil, nil
}

func (*fakeFavoritesRepo) DeleteFavorite(context.Context, int, int) error {
	return nil
}

var _ users.Repository = fakeUsersRepo{}
var _ grenadeclasses.Repository = fakeGrenadeClassesRepo{}
var _ favorites.Repository = (*fakeFavoritesRepo)(nil)
var _ pullrequests.Repository = fakePullRequestsRepo{}
var _ maps.Repository = (*fakeMapsRepo)(nil)
