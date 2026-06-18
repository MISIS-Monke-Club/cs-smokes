package users_test

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/users"
	"github.com/go-chi/chi/v5"
)

func TestUsersListAndSlashReturnPublicDTOs(t *testing.T) {
	repo := newUserRepo()
	router := chi.NewRouter()
	users.RegisterRoutes(router, users.NewHandler(repo))

	for _, path := range []string{"/api/users", "/api/users/"} {
		t.Run(path, func(t *testing.T) {
			recorder := perform(router, http.MethodGet, path, "")

			if recorder.Code != http.StatusOK {
				t.Fatalf("status = %d, body = %s", recorder.Code, recorder.Body.String())
			}
			var body []map[string]any
			decode(t, recorder, &body)
			if len(body) != 1 {
				t.Fatalf("len = %d, want 1", len(body))
			}
			assertUserDTO(t, body[0])
		})
	}
}

func TestUsersCreateUpdatePatchAndDelete(t *testing.T) {
	repo := newUserRepo()
	router := chi.NewRouter()
	users.RegisterRoutes(router, users.NewHandler(repo))

	create := perform(router, http.MethodPost, "/api/users", `{"username":"new","email":"new@example.com","password":"password"}`)
	if create.Code != http.StatusCreated {
		t.Fatalf("create status = %d, body = %s", create.Code, create.Body.String())
	}
	var created map[string]any
	decode(t, create, &created)
	assertUserDTO(t, created)

	put := perform(router, http.MethodPut, "/api/users/1", `{"username":"player","email":"player@example.com","first_name":"Play"}`)
	if put.Code != http.StatusOK {
		t.Fatalf("put status = %d, body = %s", put.Code, put.Body.String())
	}

	patch := perform(router, http.MethodPatch, "/api/users/1", `{"last_name":"Er"}`)
	if patch.Code != http.StatusOK {
		t.Fatalf("patch status = %d, body = %s", patch.Code, patch.Body.String())
	}

	deleteResp := perform(router, http.MethodDelete, "/api/users/1", "")
	if deleteResp.Code != http.StatusNoContent || deleteResp.Body.Len() != 0 {
		t.Fatalf("delete status/body = %d/%q", deleteResp.Code, deleteResp.Body.String())
	}
}

func TestUsersErrorsMatchLegacyVisibleShapes(t *testing.T) {
	repo := newUserRepo()
	router := chi.NewRouter()
	users.RegisterRoutes(router, users.NewHandler(repo))

	missing := perform(router, http.MethodGet, "/api/users/404", "")
	if missing.Code != http.StatusNotFound {
		t.Fatalf("missing status = %d", missing.Code)
	}
	if !strings.Contains(missing.Body.String(), `"detail":"Not found."`) {
		t.Fatalf("missing body = %s", missing.Body.String())
	}

	duplicate := perform(router, http.MethodPost, "/api/users", `{"username":"player","email":"player@example.com","password":"password"}`)
	if duplicate.Code != http.StatusBadRequest {
		t.Fatalf("duplicate status = %d", duplicate.Code)
	}
	if !strings.Contains(duplicate.Body.String(), `"username"`) || !strings.Contains(duplicate.Body.String(), `"email"`) {
		t.Fatalf("duplicate body = %s", duplicate.Body.String())
	}

	validation := perform(router, http.MethodPatch, "/api/users/1", `{"email":123}`)
	if validation.Code != http.StatusBadRequest {
		t.Fatalf("validation status = %d", validation.Code)
	}
	if !strings.Contains(validation.Body.String(), `"email"`) {
		t.Fatalf("validation body = %s", validation.Body.String())
	}
}

func assertUserDTO(t *testing.T, dto map[string]any) {
	t.Helper()
	for _, key := range []string{"user_id", "username", "email", "first_name", "last_name", "avatar_url", "steam_link", "tg_id", "is_banned"} {
		if _, ok := dto[key]; !ok {
			t.Fatalf("user dto missing %q: %#v", key, dto)
		}
	}
	if dto["user_id"] == float64(0) || dto["username"] == "" {
		t.Fatalf("invalid user dto: %#v", dto)
	}
}

type fakeUserRepo struct {
	users map[int]users.User
	next  int
}

func newUserRepo() *fakeUserRepo {
	return &fakeUserRepo{
		next: 2,
		users: map[int]users.User{
			1: {UserID: 1, Username: "player", Email: ptr("player@example.com"), TgID: int64Ptr(123456789)},
		},
	}
}

func (r *fakeUserRepo) ListUsers(context.Context) ([]users.User, error) {
	return []users.User{r.users[1]}, nil
}

func (r *fakeUserRepo) CreateUser(_ context.Context, input users.UserInput) (users.User, error) {
	if input.Username == "player" && input.Email != nil && *input.Email == "player@example.com" {
		return users.User{}, users.DuplicateError{Fields: []string{"username", "email"}}
	}
	user := users.User{UserID: r.next, Username: input.Username, Email: input.Email}
	r.users[user.UserID] = user
	r.next++
	return user, nil
}

func (r *fakeUserRepo) GetUser(_ context.Context, id int) (users.User, error) {
	user, ok := r.users[id]
	if !ok {
		return users.User{}, users.ErrNotFound
	}
	return user, nil
}

func (r *fakeUserRepo) ReplaceUser(ctx context.Context, id int, input users.UserInput) (users.User, error) {
	return r.update(ctx, id, input)
}

func (r *fakeUserRepo) PatchUser(ctx context.Context, id int, input users.UserInput) (users.User, error) {
	return r.update(ctx, id, input)
}

func (r *fakeUserRepo) DeleteUser(_ context.Context, id int) error {
	if _, ok := r.users[id]; !ok {
		return users.ErrNotFound
	}
	delete(r.users, id)
	return nil
}

func (r *fakeUserRepo) update(_ context.Context, id int, input users.UserInput) (users.User, error) {
	user, ok := r.users[id]
	if !ok {
		return users.User{}, users.ErrNotFound
	}
	if input.Username != "" {
		user.Username = input.Username
	}
	if input.Email != nil {
		user.Email = input.Email
	}
	if input.FirstName != nil {
		user.FirstName = input.FirstName
	}
	if input.LastName != nil {
		user.LastName = input.LastName
	}
	r.users[id] = user
	return user, nil
}

func perform(handler http.Handler, method string, path string, body string) *httptest.ResponseRecorder {
	request := httptest.NewRequest(method, path, strings.NewReader(body))
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

func ptr(value string) *string {
	return &value
}

func int64Ptr(value int64) *int64 {
	return &value
}

var _ users.Repository = (*fakeUserRepo)(nil)
var _ = errors.Is
