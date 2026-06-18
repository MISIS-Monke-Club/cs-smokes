package favorites

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/lineups"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/platform/httpx"
	"github.com/go-chi/chi/v5"
)

type CurrentUserFunc func(*http.Request) int

type Handler struct {
	repo        Repository
	currentUser CurrentUserFunc
}

func NewHandler(repo Repository, currentUser CurrentUserFunc) Handler {
	if currentUser == nil {
		currentUser = func(*http.Request) int { return 0 }
	}
	return Handler{repo: repo, currentUser: currentUser}
}

func (h Handler) Create(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	var input struct {
		GrenadeID int `json:"grenade_id"`
	}
	_ = json.NewDecoder(r.Body).Decode(&input)
	if input.GrenadeID == 0 {
		httpx.WriteJSON(w, http.StatusBadRequest, map[string][]string{"grenade_id": {"This field is required."}})
		return
	}
	response, err := h.repo.CreateFavorite(r.Context(), h.currentUser(r), input.GrenadeID)
	if errors.As(err, new(DuplicateError)) {
		httpx.WriteJSON(w, http.StatusBadRequest, map[string][]string{"non_field_errors": {"The fields user_id, grenade_id must make a unique set."}})
		return
	}
	if errors.Is(err, ErrNotFound) {
		writeNotFound(w)
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "favorite_failed", "Favorite operation failed.")
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, response)
}

func (h Handler) ListByUser(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	userID, ok := parseID(w, r)
	if !ok {
		return
	}
	rows, err := h.repo.ListFavoritesByUser(r.Context(), userID)
	if errors.Is(err, ErrNotFound) {
		writeNotFound(w)
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "favorites_unavailable", "Favorites are unavailable.")
		return
	}
	dto := make([]lineups.LineupDTO, len(rows))
	for i, item := range rows {
		dto[i] = lineups.ToDTO(requestBaseURL(r), item)
	}
	httpx.WriteJSON(w, http.StatusOK, dto)
}

func (h Handler) Delete(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	grenadeID, ok := parseID(w, r)
	if !ok {
		return
	}
	err := h.repo.DeleteFavorite(r.Context(), h.currentUser(r), grenadeID)
	if errors.Is(err, ErrNotFound) {
		writeNotFound(w)
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "favorite_delete_failed", "Favorite delete failed.")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h Handler) ensureRepo(w http.ResponseWriter) bool {
	if h.repo != nil {
		return true
	}
	httpx.WriteError(w, http.StatusServiceUnavailable, "repository_unavailable", "Favorites repository is not connected yet.")
	return false
}

func parseID(w http.ResponseWriter, r *http.Request) (int, bool) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeNotFound(w)
		return 0, false
	}
	return id, true
}

func writeNotFound(w http.ResponseWriter) {
	httpx.WriteJSON(w, http.StatusNotFound, map[string]string{"detail": "Not found."})
}

func requestBaseURL(r *http.Request) string {
	scheme := "http"
	if r.TLS != nil {
		scheme = "https"
	}
	return scheme + "://" + r.Host
}
