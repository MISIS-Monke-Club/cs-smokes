package maps

import (
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
	rows, err := h.repo.ListMaps(r.Context(), parseFilter(r))
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "maps_unavailable", "Maps are unavailable.")
		return
	}
	baseURL := requestBaseURL(r)
	dto := make([]MapDTO, len(rows))
	for i, item := range rows {
		dto[i] = ToDTO(baseURL, item)
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
	item, err := h.repo.CreateMap(r.Context(), input)
	h.writeMapResult(w, r, item, err, http.StatusCreated, false)
}

func (h Handler) Detail(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	id, ok := parseID(w, r)
	if !ok {
		return
	}
	item, err := h.repo.GetMap(r.Context(), id)
	h.writeMapResult(w, r, item, err, http.StatusOK, true)
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
	item, err := h.repo.ReplaceMap(r.Context(), id, input)
	h.writeMapResult(w, r, item, err, http.StatusOK, false)
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
	item, err := h.repo.PatchMap(r.Context(), id, input)
	h.writeMapResult(w, r, item, err, http.StatusOK, false)
}

func (h Handler) Delete(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	id, ok := parseID(w, r)
	if !ok {
		return
	}
	err := h.repo.DeleteMap(r.Context(), id)
	if errors.Is(err, ErrNotFound) {
		writeNotFound(w)
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "delete_failed", "Map delete failed.")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h Handler) decodeMultipart(w http.ResponseWriter, r *http.Request, requireName bool) (Input, bool) {
	if err := r.ParseMultipartForm(media.MaxImageBytes); err != nil {
		httpx.WriteJSON(w, http.StatusBadRequest, map[string][]string{"image_link": {"Invalid upload."}})
		return Input{}, false
	}
	input := Input{
		Name: r.FormValue("name"),
	}
	if _, ok := r.MultipartForm.Value["is_esports_pool"]; ok {
		value := r.FormValue("is_esports_pool") == "true"
		input.IsEsportsPool = &value
	}
	if link := r.FormValue("link"); link != "" {
		input.Link = &link
	}
	if requireName && input.Name == "" {
		httpx.WriteJSON(w, http.StatusBadRequest, map[string][]string{"name": {"This field is required."}})
		return Input{}, false
	}
	file, header, err := r.FormFile("image_link")
	if err == nil {
		defer file.Close()
		stored, err := media.SaveMultipartFile(h.mediaRoot, "maps", file, header)
		if err != nil {
			httpx.WriteJSON(w, http.StatusBadRequest, map[string][]string{"image_link": {"Invalid upload."}})
			return Input{}, false
		}
		input.ImagePath = &stored
	}
	return input, true
}

func (h Handler) writeMapResult(w http.ResponseWriter, r *http.Request, item Map, err error, status int, detail bool) {
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
		httpx.WriteError(w, http.StatusInternalServerError, "map_operation_failed", "Map operation failed.")
		return
	}
	if detail {
		httpx.WriteJSON(w, status, ToDetailDTO(requestBaseURL(r), item))
		return
	}
	httpx.WriteJSON(w, status, ToDTO(requestBaseURL(r), item))
}

func (h Handler) ensureRepo(w http.ResponseWriter) bool {
	if h.repo != nil {
		return true
	}
	httpx.WriteError(w, http.StatusServiceUnavailable, "repository_unavailable", "Maps repository is not connected yet.")
	return false
}

func parseFilter(r *http.Request) Filter {
	query := r.URL.Query()
	var esports *bool
	if raw := query.Get("is_esports_pool"); raw != "" {
		value := raw == "true"
		esports = &value
	}
	return Filter{Ordering: query.Get("ordering"), Query: query.Get("query"), IsEsportsPool: esports}
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
