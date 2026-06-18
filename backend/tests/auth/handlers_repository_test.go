package auth_test

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"sort"
	"strings"
	"testing"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/auth"
)

func TestTelegramLoginCreatesMissingUserAndReturnsTokens(t *testing.T) {
	repo := newFakeAuthRepo()
	handler := auth.NewHandler(repo, "secret", "telegram-token")
	body := `{"init_data":` + strconvQuote(signTelegramInitData(t, "telegram-token", `{"id":321,"username":"tg-player","first_name":"Tg"}`)) + `}`
	request := httptest.NewRequest(http.MethodPost, "/api/login/tg/", strings.NewReader(body))
	recorder := httptest.NewRecorder()

	handler.TelegramLogin(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", recorder.Code, recorder.Body.String())
	}
	var response map[string]any
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if response["access_token"] == "" || response["refresh_token"] == "" {
		t.Fatalf("tokens missing in response: %#v", response)
	}
	user := response["user"].(map[string]any)
	if user["username"] != "tg-player" {
		t.Fatalf("user = %#v", user)
	}
}

func TestPasswordLoginSupportsUsernameAndEmail(t *testing.T) {
	for _, login := range []string{"player", "player@example.test"} {
		t.Run(login, func(t *testing.T) {
			repo := newFakeAuthRepo()
			handler := auth.NewHandler(repo, "secret", "telegram-token")
			body := `{"username":` + strconvQuote(login) + `,"password":"password"}`
			request := httptest.NewRequest(http.MethodPost, "/api/login/", strings.NewReader(body))
			recorder := httptest.NewRecorder()

			handler.Login(recorder, request)

			if recorder.Code != http.StatusOK {
				t.Fatalf("status = %d, body = %s", recorder.Code, recorder.Body.String())
			}
			if !strings.Contains(recorder.Body.String(), `"access_token"`) {
				t.Fatalf("missing token response: %s", recorder.Body.String())
			}
		})
	}
}

func TestPasswordLoginInvalidCredentialsReturnsVisibleFieldErrors(t *testing.T) {
	repo := newFakeAuthRepo()
	handler := auth.NewHandler(repo, "secret", "telegram-token")
	body := `{"username":"player","password":"wrong"}`
	request := httptest.NewRequest(http.MethodPost, "/api/login/", strings.NewReader(body))
	recorder := httptest.NewRecorder()

	handler.Login(recorder, request)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusBadRequest)
	}
	if !strings.Contains(recorder.Body.String(), `"username"`) ||
		!strings.Contains(recorder.Body.String(), `"password"`) {
		t.Fatalf("body missing visible field errors: %s", recorder.Body.String())
	}
}

func TestRegisterCreatesPasswordUser(t *testing.T) {
	repo := newFakeAuthRepo()
	handler := auth.NewHandler(repo, "secret", "telegram-token")
	body := `{"username":"new-player","email":"new@example.test","password":"password"}`
	request := httptest.NewRequest(http.MethodPost, "/api/register/", strings.NewReader(body))
	recorder := httptest.NewRecorder()

	handler.Register(recorder, request)

	if recorder.Code != http.StatusCreated {
		t.Fatalf("status = %d, body = %s", recorder.Code, recorder.Body.String())
	}
	if !strings.Contains(recorder.Body.String(), `"username":"new-player"`) {
		t.Fatalf("body = %s", recorder.Body.String())
	}
}

func TestRegisterRequiredFieldsReturnVisibleErrors(t *testing.T) {
	repo := newFakeAuthRepo()
	handler := auth.NewHandler(repo, "secret", "telegram-token")
	request := httptest.NewRequest(http.MethodPost, "/api/register/", strings.NewReader(`{}`))
	recorder := httptest.NewRecorder()

	handler.Register(recorder, request)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusBadRequest)
	}
	if !strings.Contains(recorder.Body.String(), `"username"`) ||
		!strings.Contains(recorder.Body.String(), `"email"`) ||
		!strings.Contains(recorder.Body.String(), `"password"`) {
		t.Fatalf("body missing required field errors: %s", recorder.Body.String())
	}
}

type fakeAuthRepo struct {
	user auth.UserRecord
}

func newFakeAuthRepo() *fakeAuthRepo {
	return &fakeAuthRepo{
		user: auth.UserRecord{
			UserID:       7,
			Username:     "player",
			Email:        "player@example.test",
			PasswordHash: "pbkdf2_sha256$720000$testsalt$61IgY/P6T7Qtowk/Vb2vNgc5TzaGURpWPHcfpIzPBUc=",
			FirstName:    "Play",
			LastName:     "Er",
			AvatarURL:    "https://example.test/avatar.png",
		},
	}
}

func (f *fakeAuthRepo) FindByTelegramID(_ context.Context, _ int64) (auth.UserRecord, error) {
	return auth.UserRecord{}, auth.ErrUserNotFound
}

func (f *fakeAuthRepo) CreateTelegramUser(_ context.Context, user auth.TelegramUser) (auth.UserRecord, error) {
	return auth.UserRecord{
		UserID:     8,
		Username:   user.Username,
		FirstName:  user.FirstName,
		LastName:   user.LastName,
		AvatarURL:  user.PhotoURL,
		TelegramID: user.ID,
	}, nil
}

func (f *fakeAuthRepo) FindByUsernameOrEmail(_ context.Context, value string) (auth.UserRecord, error) {
	if value == f.user.Username || value == f.user.Email {
		return f.user, nil
	}
	return auth.UserRecord{}, auth.ErrUserNotFound
}

func (f *fakeAuthRepo) CreatePasswordUser(_ context.Context, input auth.RegisterInput) (auth.UserRecord, error) {
	return auth.UserRecord{UserID: 9, Username: input.Username, Email: input.Email}, nil
}

func (f *fakeAuthRepo) RolesForUser(_ context.Context, _ int) (auth.RoleSet, error) {
	return auth.RoleSet{IsEditor: true}, nil
}

func signTelegramInitData(t *testing.T, token string, userJSON string) string {
	t.Helper()
	values := url.Values{}
	values.Set("user", userJSON)
	values.Set("auth_date", "1700000000")
	dataCheck := dataCheckString(values)
	secretMAC := hmac.New(sha256.New, []byte("WebAppData"))
	_, _ = secretMAC.Write([]byte(token))
	dataMAC := hmac.New(sha256.New, secretMAC.Sum(nil))
	_, _ = dataMAC.Write([]byte(dataCheck))
	values.Set("hash", hex.EncodeToString(dataMAC.Sum(nil)))
	return values.Encode()
}

func dataCheckString(values url.Values) string {
	keys := make([]string, 0, len(values))
	for key := range values {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	parts := make([]string, 0, len(keys))
	for _, key := range keys {
		parts = append(parts, key+"="+values.Get(key))
	}
	return strings.Join(parts, "\n")
}

func strconvQuote(value string) string {
	encoded, _ := json.Marshal(value)
	return string(encoded)
}
