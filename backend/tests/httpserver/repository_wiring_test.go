package httpserver_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/auth"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/config"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/favorites"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/grenadeclasses"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/lineups"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/platform/httpserver"
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
