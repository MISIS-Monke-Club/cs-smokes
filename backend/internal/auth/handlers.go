package auth

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/platform/httpx"
)

var ErrUserNotFound = errors.New("user not found")

type UserRepository interface {
	FindByTelegramID(ctx context.Context, tgID int64) (UserRecord, error)
	CreateTelegramUser(ctx context.Context, user TelegramUser) (UserRecord, error)
	FindByUsernameOrEmail(ctx context.Context, value string) (UserRecord, error)
	CreatePasswordUser(ctx context.Context, input RegisterInput) (UserRecord, error)
	RolesForUser(ctx context.Context, userID int) (RoleSet, error)
}

type UserRecord struct {
	UserID       int
	Username     string
	Email        string
	PasswordHash string
	FirstName    string
	LastName     string
	AvatarURL    string
	SteamLink    string
	TelegramID   int64
	IsBanned     bool
}

type RegisterInput struct {
	Username string
	Email    string
	Password string
}

type RoleSet struct {
	IsSuperuser bool
	IsBaseAdmin bool
	IsEditor    bool
}

type Handler struct {
	repo          UserRepository
	secret        string
	telegramToken string
}

func NewHandler(repo UserRepository, secret string, telegramToken string) Handler {
	return Handler{repo: repo, secret: secret, telegramToken: telegramToken}
}

func (h Handler) TelegramLogin(w http.ResponseWriter, r *http.Request) {
	var input struct {
		InitData string `json:"init_data"`
	}
	_ = json.NewDecoder(r.Body).Decode(&input)
	if input.InitData == "" {
		writeLegacyError(w, http.StatusBadRequest, "init_data is required")
		return
	}
	if !CheckTelegramWebAppSignature(h.telegramToken, input.InitData) {
		writeLegacyError(w, http.StatusBadRequest, "Invalid hash. Data has been tampered with.")
		return
	}
	if h.repo == nil {
		httpx.WriteError(w, http.StatusServiceUnavailable, "repository_unavailable", "Auth repository is not connected yet.")
		return
	}
	telegramUser, err := ParseTelegramUser(input.InitData)
	if err != nil {
		writeLegacyError(w, http.StatusBadRequest, "Invalid user payload.")
		return
	}
	user, err := h.repo.FindByTelegramID(r.Context(), telegramUser.ID)
	if errors.Is(err, ErrUserNotFound) {
		user, err = h.repo.CreateTelegramUser(r.Context(), telegramUser)
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "auth_failed", "Authentication failed.")
		return
	}
	h.writeTokenResponse(w, http.StatusOK, r.Context(), user)
}

func (h Handler) Login(w http.ResponseWriter, r *http.Request) {
	if h.repo == nil {
		httpx.WriteError(w, http.StatusServiceUnavailable, "repository_unavailable", "Auth repository is not connected yet.")
		return
	}
	var input struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	_ = json.NewDecoder(r.Body).Decode(&input)
	user, err := h.repo.FindByUsernameOrEmail(r.Context(), input.Username)
	if err != nil {
		writeCredentialErrors(w)
		return
	}
	ok, err := VerifyPassword(input.Password, user.PasswordHash)
	if err != nil || !ok {
		writeCredentialErrors(w)
		return
	}
	h.writeTokenResponse(w, http.StatusOK, r.Context(), user)
}

func (h Handler) Register(w http.ResponseWriter, r *http.Request) {
	if h.repo == nil {
		httpx.WriteError(w, http.StatusServiceUnavailable, "repository_unavailable", "Auth repository is not connected yet.")
		return
	}
	var input RegisterInput
	_ = json.NewDecoder(r.Body).Decode(&input)
	if input.Username == "" || input.Email == "" || input.Password == "" {
		httpx.WriteJSON(w, http.StatusBadRequest, map[string]string{
			"username": requiredMessage(input.Username),
			"email":    requiredMessage(input.Email),
			"password": requiredMessage(input.Password),
		})
		return
	}
	user, err := h.repo.CreatePasswordUser(r.Context(), input)
	if err != nil {
		httpx.WriteError(w, http.StatusBadRequest, "registration_failed", err.Error())
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, publicUser(user))
}

func writeLegacyError(w http.ResponseWriter, status int, message string) {
	httpx.WriteJSON(w, status, map[string]string{"error": message})
}

func writeCredentialErrors(w http.ResponseWriter) {
	httpx.WriteJSON(w, http.StatusBadRequest, map[string][]string{
		"username": {"Invalid credentials."},
		"password": {"Invalid credentials."},
	})
}

func (h Handler) writeTokenResponse(w http.ResponseWriter, status int, ctx context.Context, user UserRecord) {
	roles, err := h.repo.RolesForUser(ctx, user.UserID)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "roles_unavailable", "User roles are unavailable.")
		return
	}
	pair, err := IssueTokenPair(h.secret, UserClaims{
		UserID:      user.UserID,
		Username:    user.Username,
		IsSuperuser: roles.IsSuperuser,
		IsBaseAdmin: roles.IsBaseAdmin,
		IsEditor:    roles.IsEditor,
	})
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "token_failed", "Token issuing failed.")
		return
	}
	httpx.WriteJSON(w, status, map[string]any{
		"user":          publicUser(user),
		"access_token":  pair.AccessToken,
		"refresh_token": pair.RefreshToken,
	})
}

func publicUser(user UserRecord) map[string]any {
	return map[string]any{
		"user_id":    user.UserID,
		"username":   user.Username,
		"email":      nullableString(user.Email),
		"first_name": nullableString(user.FirstName),
		"last_name":  nullableString(user.LastName),
		"avatar_url": nullableString(user.AvatarURL),
		"steam_link": nullableString(user.SteamLink),
		"tg_id":      nullableInt64(user.TelegramID),
		"is_banned":  user.IsBanned,
	}
}

func requiredMessage(value string) string {
	if value == "" {
		return "This field is required."
	}
	return ""
}

func nullableString(value string) any {
	if value == "" {
		return nil
	}
	return value
}

func nullableInt64(value int64) any {
	if value == 0 {
		return nil
	}
	return value
}
