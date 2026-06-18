package favorites_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/favorites"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/grenadeclasses"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/lineups"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/users"
	"github.com/go-chi/chi/v5"
)

func TestFavoritesCreateUsesCurrentUserAndReturnsLegacyDTO(t *testing.T) {
	repo := newFavoriteRepo()
	router := chi.NewRouter()
	favorites.RegisterRoutes(router, favorites.NewHandler(repo, func(*http.Request) int { return 7 }))

	resp := perform(router, http.MethodPost, "/api/favorites", `{"grenade_id":1,"user_id":999}`)
	if resp.Code != http.StatusCreated {
		t.Fatalf("status = %d, body = %s", resp.Code, resp.Body.String())
	}
	var body map[string]any
	decode(t, resp, &body)
	if body["user_id"] != float64(7) || body["grenade_id"] != float64(1) {
		t.Fatalf("body = %#v", body)
	}
}

func TestFavoritesOverloadedDetailRoute(t *testing.T) {
	repo := newFavoriteRepo()
	router := chi.NewRouter()
	favorites.RegisterRoutes(router, favorites.NewHandler(repo, func(*http.Request) int { return 7 }))

	list := perform(router, http.MethodGet, "/api/favorites/7", "")
	if list.Code != http.StatusOK {
		t.Fatalf("list status = %d, body = %s", list.Code, list.Body.String())
	}
	if repo.lastUserID != 7 {
		t.Fatalf("GET /api/favorites/{id} must treat id as user_id, got %d", repo.lastUserID)
	}
	var body []map[string]any
	decode(t, list, &body)
	if _, ok := body[0]["grenade_id"]; !ok {
		t.Fatalf("favorite lineup missing grenade_id: %#v", body[0])
	}

	deleteResp := perform(router, http.MethodDelete, "/api/favorites/99", "")
	if deleteResp.Code != http.StatusNoContent {
		t.Fatalf("delete status = %d, body = %s", deleteResp.Code, deleteResp.Body.String())
	}
	if repo.lastDeletedGrenadeID != 99 {
		t.Fatalf("DELETE /api/favorites/{id} must treat id as grenade_id, got %d", repo.lastDeletedGrenadeID)
	}
}

func TestFavoritesErrorsMatchLegacyVisibleShapes(t *testing.T) {
	repo := newFavoriteRepo()
	router := chi.NewRouter()
	favorites.RegisterRoutes(router, favorites.NewHandler(repo, func(*http.Request) int { return 7 }))

	duplicate := perform(router, http.MethodPost, "/api/favorites", `{"grenade_id":99}`)
	if duplicate.Code != http.StatusBadRequest || !strings.Contains(duplicate.Body.String(), `"non_field_errors"`) {
		t.Fatalf("duplicate status/body = %d/%s", duplicate.Code, duplicate.Body.String())
	}

	missing := perform(router, http.MethodDelete, "/api/favorites/404", "")
	if missing.Code != http.StatusNotFound || !strings.Contains(missing.Body.String(), `"detail":"Not found."`) {
		t.Fatalf("missing status/body = %d/%s", missing.Code, missing.Body.String())
	}
}

type fakeFavoriteRepo struct {
	favorites            map[[2]int]bool
	lastUserID           int
	lastDeletedGrenadeID int
	lineup               lineups.Lineup
}

func newFavoriteRepo() *fakeFavoriteRepo {
	return &fakeFavoriteRepo{
		favorites: map[[2]int]bool{{7, 99}: true},
		lineup: lineups.Lineup{
			UserID:       1,
			GrenadeID:    1,
			MapID:        1,
			Creator:      users.User{UserID: 1, Username: "player"},
			CreatedAt:    "2026-01-01T00:00:00Z",
			Title:        "Window smoke",
			IsApproved:   true,
			GrenadeClass: grenadeclasses.GrenadeClass{GrenadeClassID: 1, Name: "Smoke", Price: 300},
		},
	}
}

func (r *fakeFavoriteRepo) CreateFavorite(_ context.Context, userID int, grenadeID int) (favorites.FavoriteCreateResponse, error) {
	if r.favorites[[2]int{userID, grenadeID}] {
		return favorites.FavoriteCreateResponse{}, favorites.DuplicateError{}
	}
	r.favorites[[2]int{userID, grenadeID}] = true
	return favorites.FavoriteCreateResponse{UserID: userID, GrenadeID: grenadeID}, nil
}

func (r *fakeFavoriteRepo) ListFavoritesByUser(_ context.Context, userID int) ([]lineups.Lineup, error) {
	r.lastUserID = userID
	return []lineups.Lineup{r.lineup}, nil
}

func (r *fakeFavoriteRepo) DeleteFavorite(_ context.Context, userID int, grenadeID int) error {
	r.lastDeletedGrenadeID = grenadeID
	if !r.favorites[[2]int{userID, grenadeID}] {
		return favorites.ErrNotFound
	}
	delete(r.favorites, [2]int{userID, grenadeID})
	return nil
}

func perform(handler http.Handler, method string, path string, body string) *httptest.ResponseRecorder {
	request := httptest.NewRequest(method, path, strings.NewReader(body))
	request.Host = "example.com"
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", "Bearer test")
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, request)
	return recorder
}

func decode(t *testing.T, recorder *httptest.ResponseRecorder, target any) {
	t.Helper()
	if err := json.Unmarshal(recorder.Body.Bytes(), target); err != nil {
		t.Fatalf("decode %q: %v", recorder.Body.String(), err)
	}
}

var _ favorites.Repository = (*fakeFavoriteRepo)(nil)
