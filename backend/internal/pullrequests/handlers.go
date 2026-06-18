package pullrequests

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/platform/httpx"
	"github.com/go-chi/chi/v5"
)

type ActorFunc func(*http.Request) Actor

type Handler struct {
	repo  Repository
	actor ActorFunc
}

func NewHandler(repo Repository, actor ActorFunc) Handler {
	if actor == nil {
		actor = func(*http.Request) Actor { return Actor{} }
	}
	return Handler{repo: repo, actor: actor}
}

func (h Handler) List(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	rows, err := h.repo.ListPullRequests(r.Context())
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "pull_requests_unavailable", "Pull requests are unavailable.")
		return
	}
	dto := make([]PullRequestDTO, len(rows))
	for i, pr := range rows {
		dto[i] = ToDTO(requestBaseURL(r), pr)
	}
	httpx.WriteJSON(w, http.StatusOK, dto)
}

func (h Handler) Create(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	var input struct {
		LineupID int `json:"lineup_id"`
	}
	_ = json.NewDecoder(r.Body).Decode(&input)
	if input.LineupID == 0 {
		httpx.WriteJSON(w, http.StatusBadRequest, map[string][]string{"lineup_id": []string{"This field is required."}})
		return
	}
	pr, err := h.repo.CreatePullRequest(r.Context(), h.actor(r), input.LineupID)
	if errors.Is(err, ErrNotFound) {
		writeNotFound(w)
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "pull_request_failed", "Pull request operation failed.")
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, ToCreateDTO(pr))
}

func (h Handler) Detail(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	pr, err := h.repo.GetPullRequest(r.Context(), id)
	h.writePRResult(w, r, pr, err, http.StatusOK)
}

func (h Handler) Patch(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	var input struct {
		Status     string `json:"status"`
		ApproverID *int   `json:"approver_id"`
	}
	_ = json.NewDecoder(r.Body).Decode(&input)
	pr, err := h.repo.UpdatePullRequestStatus(r.Context(), id, input.Status, input.ApproverID)
	h.writePRResult(w, r, pr, err, http.StatusOK)
}

func (h Handler) Delete(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	err := h.repo.DeletePullRequest(r.Context(), id)
	if errors.Is(err, ErrNotFound) {
		writeNotFound(w)
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "delete_failed", "Pull request delete failed.")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h Handler) Approve(w http.ResponseWriter, r *http.Request) {
	h.moderate(w, r, StatusApproved, "Pull request approved.")
}

func (h Handler) Reject(w http.ResponseWriter, r *http.Request) {
	h.moderate(w, r, StatusRejected, "Pull request rejected.")
}

func (h Handler) Cancel(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	pr, err := h.repo.GetPullRequest(r.Context(), id)
	if errors.Is(err, ErrNotFound) {
		writeNotFound(w)
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "pull_request_failed", "Pull request operation failed.")
		return
	}
	if !CanCancel(h.actor(r), pr) {
		writeForbidden(w)
		return
	}
	if _, err := h.repo.UpdatePullRequestStatus(r.Context(), id, StatusClosed, nil); err != nil {
		h.writePRResult(w, r, PullRequest{}, err, http.StatusOK)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]string{"detail": "Pull request cancelled."})
}

func (h Handler) moderate(w http.ResponseWriter, r *http.Request, status string, detail string) {
	if !h.ensureRepo(w) {
		return
	}
	if !CanModerate(h.actor(r)) {
		writeForbidden(w)
		return
	}
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	if _, err := h.repo.UpdatePullRequestStatus(r.Context(), id, status, nil); err != nil {
		h.writePRResult(w, r, PullRequest{}, err, http.StatusOK)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]string{"detail": detail})
}

func (h Handler) ListComments(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	prID, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	rows, err := h.repo.ListComments(r.Context(), prID)
	if errors.Is(err, ErrNotFound) {
		writeNotFound(w)
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "comments_unavailable", "Comments are unavailable.")
		return
	}
	dto := make([]CommentDTO, len(rows))
	for i, comment := range rows {
		dto[i] = ToCommentDTO(comment)
	}
	httpx.WriteJSON(w, http.StatusOK, dto)
}

func (h Handler) CreateComment(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	prID, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	var input struct {
		Text string `json:"text"`
	}
	_ = json.NewDecoder(r.Body).Decode(&input)
	if input.Text == "" {
		httpx.WriteJSON(w, http.StatusBadRequest, map[string][]string{"text": []string{"This field is required."}})
		return
	}
	comment, err := h.repo.CreateComment(r.Context(), prID, h.actor(r), input.Text)
	h.writeCommentResult(w, comment, err, http.StatusCreated)
}

func (h Handler) CommentDetail(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	comment, err := h.repo.GetComment(r.Context(), id)
	h.writeCommentResult(w, comment, err, http.StatusOK)
}

func (h Handler) PatchComment(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	var input struct {
		Text string `json:"text"`
	}
	_ = json.NewDecoder(r.Body).Decode(&input)
	if input.Text == "" {
		httpx.WriteJSON(w, http.StatusBadRequest, map[string][]string{"text": []string{"This field is required."}})
		return
	}
	comment, err := h.repo.UpdateComment(r.Context(), id, input.Text)
	h.writeCommentResult(w, comment, err, http.StatusOK)
}

func (h Handler) DeleteComment(w http.ResponseWriter, r *http.Request) {
	if !h.ensureRepo(w) {
		return
	}
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	err := h.repo.DeleteComment(r.Context(), id)
	if errors.Is(err, ErrNotFound) {
		writeNotFound(w)
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "delete_failed", "Comment delete failed.")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h Handler) writePRResult(w http.ResponseWriter, r *http.Request, pr PullRequest, err error, status int) {
	if errors.Is(err, ErrNotFound) {
		writeNotFound(w)
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "pull_request_failed", "Pull request operation failed.")
		return
	}
	httpx.WriteJSON(w, status, ToDTO(requestBaseURL(r), pr))
}

func (h Handler) writeCommentResult(w http.ResponseWriter, comment Comment, err error, status int) {
	if errors.Is(err, ErrNotFound) {
		writeNotFound(w)
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "comment_failed", "Comment operation failed.")
		return
	}
	httpx.WriteJSON(w, status, ToCommentDTO(comment))
}

func (h Handler) ensureRepo(w http.ResponseWriter) bool {
	if h.repo != nil {
		return true
	}
	httpx.WriteError(w, http.StatusServiceUnavailable, "repository_unavailable", "Pull request repository is not connected yet.")
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

func writeForbidden(w http.ResponseWriter) {
	status, body := ForbiddenBody()
	httpx.WriteJSON(w, status, body)
}

func requestBaseURL(r *http.Request) string {
	scheme := "http"
	if r.TLS != nil {
		scheme = "https"
	}
	return scheme + "://" + r.Host
}
