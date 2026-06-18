package users

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/platform/httpx"
	"github.com/go-chi/chi/v5"
)

type Handler struct {
	repo Repository
}

func NewHandler(repo Repository) Handler {
	return Handler{repo: repo}
}

func (h Handler) List(w http.ResponseWriter, r *http.Request) {
	if h.repo == nil {
		httpx.WriteError(w, http.StatusServiceUnavailable, "repository_unavailable", "Users repository is not connected yet.")
		return
	}
	rows, err := h.repo.ListUsers(r.Context())
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "users_unavailable", "Users are unavailable.")
		return
	}
	dto := make([]UserDTO, len(rows))
	for i, user := range rows {
		dto[i] = ToDTO(user)
	}
	httpx.WriteJSON(w, http.StatusOK, dto)
}

func (h Handler) Create(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	input, ok := decodeInput(w, r, true, true)
	if !ok {
		return
	}
	user, err := h.repo.CreateUser(r.Context(), input)
	h.writeUserResult(w, user, err, http.StatusCreated)
}

func (h Handler) Detail(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	user, err := h.repo.GetUser(r.Context(), id)
	h.writeUserResult(w, user, err, http.StatusOK)
}

func (h Handler) Replace(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	input, ok := decodeInput(w, r, true, false)
	if !ok {
		return
	}
	user, err := h.repo.ReplaceUser(r.Context(), id, input)
	h.writeUserResult(w, user, err, http.StatusOK)
}

func (h Handler) Patch(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	input, ok := decodeInput(w, r, false, false)
	if !ok {
		return
	}
	user, err := h.repo.PatchUser(r.Context(), id, input)
	h.writeUserResult(w, user, err, http.StatusOK)
}

func (h Handler) Delete(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	err := h.repo.DeleteUser(r.Context(), id)
	if errors.Is(err, ErrNotFound) {
		writeNotFound(w)
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "delete_failed", "User delete failed.")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h Handler) writeUserResult(w http.ResponseWriter, user User, err error, status int) {
	if errors.Is(err, ErrNotFound) {
		writeNotFound(w)
		return
	}
	var duplicate DuplicateError
	if errors.As(err, &duplicate) {
		writeDuplicate(w, duplicate.Fields)
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "user_operation_failed", "User operation failed.")
		return
	}
	httpx.WriteJSON(w, status, ToDTO(user))
}

func decodeInput(w http.ResponseWriter, r *http.Request, requireUsername bool, requirePassword bool) (UserInput, bool) {
	var input UserInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		httpx.WriteJSON(w, http.StatusBadRequest, map[string][]string{"email": []string{"Invalid value."}})
		return UserInput{}, false
	}
	errorsByField := map[string][]string{}
	if requireUsername && input.Username == "" {
		errorsByField["username"] = []string{"This field is required."}
	}
	if requirePassword && input.Password == "" {
		errorsByField["password"] = []string{"This field is required."}
	}
	if len(errorsByField) > 0 {
		httpx.WriteJSON(w, http.StatusBadRequest, errorsByField)
		return UserInput{}, false
	}
	return input, true
}

func (h Handler) ensureRepo(w http.ResponseWriter) bool {
	if h.repo != nil {
		return true
	}
	httpx.WriteError(w, http.StatusServiceUnavailable, "repository_unavailable", "Users repository is not connected yet.")
	return false
}

func parseID(w http.ResponseWriter, r *http.Request, name string) (int, bool) {
	id, err := strconv.Atoi(chi.URLParam(r, name))
	if err != nil {
		writeNotFound(w)
		return 0, false
	}
	return id, true
}

func writeNotFound(w http.ResponseWriter) {
	httpx.WriteJSON(w, http.StatusNotFound, map[string]string{"detail": "Not found."})
}

func writeDuplicate(w http.ResponseWriter, fields []string) {
	body := map[string][]string{}
	for _, field := range fields {
		body[field] = []string{"A user with this value already exists."}
	}
	httpx.WriteJSON(w, http.StatusBadRequest, body)
}
