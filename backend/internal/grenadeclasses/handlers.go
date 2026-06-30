package grenadeclasses

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
		httpx.WriteError(w, http.StatusServiceUnavailable, "repository_unavailable", "Grenade class repository is not connected yet.")
		return
	}
	rows, err := h.repo.ListGrenadeClasses(r.Context())
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "grenade_classes_unavailable", "Grenade classes are unavailable.")
		return
	}
	dto := make([]GrenadeClassDTO, len(rows))
	for i, class := range rows {
		dto[i] = ToDTO(class)
	}
	httpx.WriteJSON(w, http.StatusOK, dto)
}

func (h Handler) Create(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	input, ok := decodeInput(w, r, true)
	if !ok {
		return
	}
	class, err := h.repo.CreateGrenadeClass(r.Context(), input)
	h.writeClassResult(w, class, err, http.StatusCreated)
}

func (h Handler) Detail(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	id, ok := parseID(w, r)
	if !ok {
		return
	}
	class, err := h.repo.GetGrenadeClass(r.Context(), id)
	h.writeClassResult(w, class, err, http.StatusOK)
}

func (h Handler) Replace(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	id, ok := parseID(w, r)
	if !ok {
		return
	}
	input, ok := decodeInput(w, r, true)
	if !ok {
		return
	}
	class, err := h.repo.ReplaceGrenadeClass(r.Context(), id, input)
	h.writeClassResult(w, class, err, http.StatusOK)
}

func (h Handler) Patch(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	id, ok := parseID(w, r)
	if !ok {
		return
	}
	input, ok := decodeInput(w, r, false)
	if !ok {
		return
	}
	class, err := h.repo.PatchGrenadeClass(r.Context(), id, input)
	h.writeClassResult(w, class, err, http.StatusOK)
}

func (h Handler) Delete(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	id, ok := parseID(w, r)
	if !ok {
		return
	}
	err := h.repo.DeleteGrenadeClass(r.Context(), id)
	if errors.Is(err, ErrNotFound) {
		writeNotFound(w)
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "delete_failed", "Grenade class delete failed.")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h Handler) writeClassResult(w http.ResponseWriter, class GrenadeClass, err error, status int) {
	if errors.Is(err, ErrNotFound) {
		writeNotFound(w)
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "grenade_class_operation_failed", "Grenade class operation failed.")
		return
	}
	httpx.WriteJSON(w, status, ToDTO(class))
}

func decodeInput(w http.ResponseWriter, r *http.Request, requireName bool) (Input, bool) {
	var input Input
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		httpx.WriteJSON(w, http.StatusBadRequest, map[string][]string{"price": []string{"Invalid value."}})
		return Input{}, false
	}
	errorsByField := map[string][]string{}
	if requireName && input.Name == "" {
		errorsByField["name"] = []string{"This field is required."}
	}
	if input.Price != nil && *input.Price < 0 {
		errorsByField["price"] = []string{"Ensure this value is greater than or equal to 0."}
	}
	if len(errorsByField) > 0 {
		httpx.WriteJSON(w, http.StatusBadRequest, errorsByField)
		return Input{}, false
	}
	return input, true
}

func (h Handler) ensureRepo(w http.ResponseWriter) bool {
	if h.repo != nil {
		return true
	}
	httpx.WriteError(w, http.StatusServiceUnavailable, "repository_unavailable", "Grenade class repository is not connected yet.")
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
