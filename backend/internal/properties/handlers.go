package properties

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
	if !h.ensureRepo(w) {
		return
	}
	rows, err := h.repo.ListProperties(r.Context())
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "properties_unavailable", "Properties are unavailable.")
		return
	}
	dto := make([]PropertyDTO, len(rows))
	for i, property := range rows {
		dto[i] = ToDTO(property)
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
	property, err := h.repo.CreateProperty(r.Context(), input)
	h.writePropertyResult(w, property, err, http.StatusCreated)
}

func (h Handler) Detail(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	property, err := h.repo.GetProperty(r.Context(), id)
	h.writePropertyResult(w, property, err, http.StatusOK)
}

func (h Handler) Replace(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	input, ok := decodeInput(w, r, true)
	if !ok {
		return
	}
	property, err := h.repo.ReplaceProperty(r.Context(), id, input)
	h.writePropertyResult(w, property, err, http.StatusOK)
}

func (h Handler) Patch(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	input, ok := decodeInput(w, r, false)
	if !ok {
		return
	}
	property, err := h.repo.PatchProperty(r.Context(), id, input)
	h.writePropertyResult(w, property, err, http.StatusOK)
}

func (h Handler) Delete(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	err := h.repo.DeleteProperty(r.Context(), id)
	if errors.Is(err, ErrNotFound) {
		writeNotFound(w)
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "delete_failed", "Property delete failed.")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h Handler) ListRelations(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	var grenadeID *int
	if raw := r.URL.Query().Get("grenade_id"); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err == nil {
			grenadeID = &parsed
		}
	}
	rows, err := h.repo.ListPropertyRelations(r.Context(), grenadeID)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "property_relations_unavailable", "Property relations are unavailable.")
		return
	}
	dto := make([]PropertyRelationDTO, len(rows))
	for i, relation := range rows {
		dto[i] = ToRelationDTO(relation)
	}
	httpx.WriteJSON(w, http.StatusOK, dto)
}

func (h Handler) CreateLineupProperty(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	grenadeID, ok := parseID(w, r, "grenade_id")
	if !ok {
		return
	}
	var input struct {
		PropertyID int `json:"property_id"`
	}
	_ = json.NewDecoder(r.Body).Decode(&input)
	if input.PropertyID == 0 {
		httpx.WriteJSON(w, http.StatusBadRequest, map[string][]string{"property_id": {"This field is required."}})
		return
	}
	relation, err := h.repo.CreateLineupProperty(r.Context(), grenadeID, input.PropertyID)
	h.writeRelationResult(w, relation, err, http.StatusCreated)
}

func (h Handler) DeleteLineupProperty(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	grenadeID, ok := parseID(w, r, "grenade_id")
	if !ok {
		return
	}
	propertyID, ok := parseID(w, r, "property_id")
	if !ok {
		return
	}
	err := h.repo.DeleteLineupProperty(r.Context(), grenadeID, propertyID)
	if errors.Is(err, ErrNotFound) {
		writeNotFound(w)
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "delete_failed", "Property relation delete failed.")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h Handler) writePropertyResult(w http.ResponseWriter, property Property, err error, status int) {
	if errors.Is(err, ErrNotFound) {
		writeNotFound(w)
		return
	}
	var validation ValidationError
	if errors.As(err, &validation) {
		writeFieldErrors(w, validation.Fields)
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "property_operation_failed", "Property operation failed.")
		return
	}
	httpx.WriteJSON(w, status, ToDTO(property))
}

func (h Handler) writeRelationResult(w http.ResponseWriter, relation PropertyRelation, err error, status int) {
	if errors.Is(err, ErrNotFound) {
		writeNotFound(w)
		return
	}
	var duplicate DuplicateError
	if errors.As(err, &duplicate) {
		httpx.WriteJSON(w, http.StatusBadRequest, map[string][]string{"non_field_errors": {"The fields property_id, grenade_id must make a unique set."}})
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "property_relation_failed", "Property relation operation failed.")
		return
	}
	httpx.WriteJSON(w, status, ToRelationDTO(relation))
}

func decodeInput(w http.ResponseWriter, r *http.Request, requireName bool) (Input, bool) {
	var input Input
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		httpx.WriteJSON(w, http.StatusBadRequest, map[string][]string{"name": {"Invalid value."}})
		return Input{}, false
	}
	if requireName && input.Name == "" {
		writeFieldErrors(w, []string{"name"})
		return Input{}, false
	}
	return input, true
}

func writeFieldErrors(w http.ResponseWriter, fields []string) {
	body := map[string][]string{}
	for _, field := range fields {
		body[field] = []string{"This field is required."}
	}
	httpx.WriteJSON(w, http.StatusBadRequest, body)
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

func (h Handler) ensureRepo(w http.ResponseWriter) bool {
	if h.repo != nil {
		return true
	}
	httpx.WriteError(w, http.StatusServiceUnavailable, "repository_unavailable", "Properties repository is not connected yet.")
	return false
}
