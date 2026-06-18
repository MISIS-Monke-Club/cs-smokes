package lineups

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/media"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/platform/httpx"
	"github.com/go-chi/chi/v5"
)

type Handler struct {
	repo      Repository
	mediaRoot string
}

func NewHandler(repo Repository, mediaRoot string) Handler {
	return Handler{repo: repo, mediaRoot: mediaRoot}
}

func (h Handler) List(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	rows, err := h.repo.ListLineups(r.Context(), ParseFilter(r.URL.Query()))
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "lineups_unavailable", "Lineups are unavailable.")
		return
	}
	dto := make([]LineupDTO, len(rows))
	for i, item := range rows {
		dto[i] = ToDTO(requestBaseURL(r), item)
	}
	httpx.WriteJSON(w, http.StatusOK, dto)
}

func (h Handler) Create(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	input, ok := h.decodeMultipart(w, r, true)
	if !ok {
		return
	}
	item, err := h.repo.CreateLineup(r.Context(), input)
	h.writeLineupResult(w, r, item, err, http.StatusCreated)
}

func (h Handler) Detail(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	id, ok := parseID(w, r)
	if !ok {
		return
	}
	item, err := h.repo.GetLineup(r.Context(), id)
	h.writeLineupResult(w, r, item, err, http.StatusOK)
}

func (h Handler) Replace(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	id, ok := parseID(w, r)
	if !ok {
		return
	}
	input, ok := h.decodeMultipart(w, r, true)
	if !ok {
		return
	}
	item, err := h.repo.ReplaceLineup(r.Context(), id, input)
	h.writeLineupResult(w, r, item, err, http.StatusOK)
}

func (h Handler) Patch(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	id, ok := parseID(w, r)
	if !ok {
		return
	}
	input, ok := h.decodeMultipart(w, r, false)
	if !ok {
		return
	}
	item, err := h.repo.PatchLineup(r.Context(), id, input)
	h.writeLineupResult(w, r, item, err, http.StatusOK)
}

func (h Handler) Delete(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	id, ok := parseID(w, r)
	if !ok {
		return
	}
	err := h.repo.DeleteLineup(r.Context(), id)
	if errors.Is(err, ErrNotFound) {
		writeNotFound(w)
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "delete_failed", "Lineup delete failed.")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h Handler) ChangeGrenadeClass(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	id, ok := parseID(w, r)
	if !ok {
		return
	}
	var input struct {
		GrenadeClassID int `json:"grenade_class_id"`
	}
	_ = json.NewDecoder(r.Body).Decode(&input)
	if input.GrenadeClassID == 0 {
		httpx.WriteJSON(w, http.StatusBadRequest, map[string][]string{"grenade_class_id": []string{"This field is required."}})
		return
	}
	item, err := h.repo.ChangeGrenadeClass(r.Context(), id, input.GrenadeClassID)
	h.writeLineupResult(w, r, item, err, http.StatusOK)
}

func ViewFilters(w http.ResponseWriter, _ *http.Request) {
	httpx.WriteJSON(w, http.StatusOK, map[string][]string{"is_approved": {"true", "false"}})
}

func ViewSorts(w http.ResponseWriter, _ *http.Request) {
	httpx.WriteJSON(w, http.StatusOK, map[string][]string{
		"ordering": {"date_of_creation", "-date_of_creation", "by_alphabet", "-by_alphabet"},
	})
}

func (h Handler) decodeMultipart(w http.ResponseWriter, r *http.Request, requireTitle bool) (Input, bool) {
	if err := r.ParseMultipartForm(media.MaxImageBytes); err != nil {
		httpx.WriteJSON(w, http.StatusBadRequest, map[string][]string{"preview_image_link": []string{"Invalid upload."}})
		return Input{}, false
	}
	input := Input{
		MapID:          parseInt(r.FormValue("map_id")),
		UserID:         parseInt(r.FormValue("user_id")),
		Title:          r.FormValue("title"),
		IsApproved:     r.FormValue("is_approved") == "true",
		Views:          parseInt(r.FormValue("views")),
		GrenadeClassID: parseInt(r.FormValue("grenade_class_id")),
	}
	if link := r.FormValue("link_to_video"); link != "" {
		input.LinkToVideo = &link
	}
	if description := r.FormValue("description"); description != "" {
		input.Description = &description
	}
	if requireTitle && input.Title == "" {
		httpx.WriteJSON(w, http.StatusBadRequest, map[string][]string{"title": []string{"This field is required."}})
		return Input{}, false
	}
	file, header, err := r.FormFile("preview_image_link")
	if err == nil {
		defer file.Close()
		stored, err := media.SaveMultipartFile(h.mediaRoot, "lineups", file, header)
		if err != nil {
			httpx.WriteJSON(w, http.StatusBadRequest, map[string][]string{"preview_image_link": []string{"Invalid upload."}})
			return Input{}, false
		}
		input.PreviewImagePath = &stored
	}
	return input, true
}

func (h Handler) writeLineupResult(w http.ResponseWriter, r *http.Request, item Lineup, err error, status int) {
	if errors.Is(err, ErrNotFound) {
		writeNotFound(w)
		return
	}
	var validation ValidationError
	if errors.As(err, &validation) {
		body := map[string][]string{}
		for _, field := range validation.Fields {
			body[field] = []string{"This field is required."}
		}
		httpx.WriteJSON(w, http.StatusBadRequest, body)
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "lineup_operation_failed", "Lineup operation failed.")
		return
	}
	httpx.WriteJSON(w, status, ToDTO(requestBaseURL(r), item))
}

func (h Handler) ensureRepo(w http.ResponseWriter) bool {
	if h.repo != nil {
		return true
	}
	httpx.WriteError(w, http.StatusServiceUnavailable, "repository_unavailable", "Lineups repository is not connected yet.")
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

func parseInt(value string) int {
	parsed, _ := strconv.Atoi(value)
	return parsed
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
