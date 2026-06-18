package admin

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/auth"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/platform/httpx"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/pullrequests"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/users"
	"github.com/go-chi/chi/v5"
)

type Actor struct {
	UserID int
	Claims auth.RoleSet
}

type ActorFunc func(*http.Request) (Actor, bool)

type RoleRepository interface {
	RolesForUser(ctx context.Context, userID int) (auth.RoleSet, error)
	SetUserRoles(ctx context.Context, userID int, roles auth.RoleSet) error
}

type UserRepository interface {
	users.Repository
}

type PullRequestRepository interface {
	pullrequests.Repository
}

type Handler struct {
	roles RoleRepository
	users UserRepository
	prs   PullRequestRepository
	actor ActorFunc
}

func NewHandler(roles RoleRepository, users UserRepository, prs PullRequestRepository, actor ActorFunc) Handler {
	return Handler{roles: roles, users: users, prs: prs, actor: actor}
}

func RequireAdmin(roles RoleRepository, actor ActorFunc, next http.HandlerFunc) http.HandlerFunc {
	h := Handler{roles: roles, actor: actor}
	return func(w http.ResponseWriter, r *http.Request) {
		if _, ok := h.requireAdmin(w, r); !ok {
			return
		}
		next(w, r)
	}
}

func RegisterRoutes(router chi.Router, h Handler) {
	for _, path := range adminPaths("/me") {
		router.Get(path, h.Me)
	}
	for _, path := range adminPaths("/users") {
		router.Get(path, h.ListUsers)
	}
	for _, path := range adminPaths("/users/{id}") {
		router.Get(path, h.GetUser)
		router.Patch(path, h.PatchUser)
		router.Delete(path, h.DeleteUser)
	}
	for _, path := range adminPaths("/users/{id}/roles") {
		router.Put(path, h.SetUserRoles)
	}
	for _, path := range adminPaths("/pull_requests") {
		router.Get(path, h.ListPullRequests)
	}
	for _, path := range adminPaths("/pull_requests/{id}") {
		router.Get(path, h.PullRequestDetail)
	}
	for _, path := range adminPaths("/pull_requests/{id}/approve") {
		router.Patch(path, h.ApprovePullRequest)
	}
	for _, path := range adminPaths("/pull_requests/{id}/reject") {
		router.Patch(path, h.RejectPullRequest)
	}
	for _, path := range adminPaths("/pull_requests/{id}/cancel") {
		router.Patch(path, h.CancelPullRequest)
	}
	for _, path := range adminPaths("/pull_requests/{id}/comments") {
		router.Get(path, h.ListComments)
		router.Post(path, h.CreateComment)
	}
	for _, path := range adminPaths("/comments/{id}") {
		router.Delete(path, h.DeleteComment)
	}
}

func adminPaths(path string) []string {
	base := "/api/admin" + path
	return []string{base, base + "/"}
}

func (h Handler) Me(w http.ResponseWriter, r *http.Request) {
	actor, ok := h.requireAdmin(w, r)
	if !ok {
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"user_id": actor.UserID, "roles": roleCodes(actor.Roles)})
}

func (h Handler) ListUsers(w http.ResponseWriter, r *http.Request) {
	if _, ok := h.requireUserManager(w, r); !ok {
		return
	}
	rows, err := h.users.ListUsers(r.Context())
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "users_unavailable", "Users are unavailable.")
		return
	}
	dto := make([]users.UserDTO, len(rows))
	for i, user := range rows {
		dto[i] = users.ToDTO(user)
	}
	httpx.WriteJSON(w, http.StatusOK, dto)
}

func (h Handler) GetUser(w http.ResponseWriter, r *http.Request) {
	if _, ok := h.requireUserManager(w, r); !ok {
		return
	}
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	user, err := h.users.GetUser(r.Context(), id)
	h.writeUserResult(w, user, err)
}

func (h Handler) PatchUser(w http.ResponseWriter, r *http.Request) {
	if _, ok := h.requireUserManager(w, r); !ok {
		return
	}
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	var input users.UserInput
	_ = json.NewDecoder(r.Body).Decode(&input)
	user, err := h.users.PatchUser(r.Context(), id, input)
	h.writeUserResult(w, user, err)
}

func (h Handler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	actor, ok := h.requireAdmin(w, r)
	if !ok {
		return
	}
	if !actor.Roles.IsSuperuser {
		writeForbidden(w)
		return
	}
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	if err := h.users.DeleteUser(r.Context(), id); err != nil {
		if errors.Is(err, users.ErrNotFound) {
			writeNotFound(w)
			return
		}
		httpx.WriteError(w, http.StatusInternalServerError, "delete_failed", "User delete failed.")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h Handler) SetUserRoles(w http.ResponseWriter, r *http.Request) {
	actor, ok := h.requireAdmin(w, r)
	if !ok {
		return
	}
	if !actor.Roles.IsSuperuser {
		writeForbidden(w)
		return
	}
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	var input struct {
		Roles []string `json:"roles"`
	}
	_ = json.NewDecoder(r.Body).Decode(&input)
	roles, valid := parseRoles(input.Roles)
	if !valid {
		httpx.WriteError(w, http.StatusBadRequest, "validation_failed", "Invalid role.")
		return
	}
	if err := h.roles.SetUserRoles(r.Context(), id, roles); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "roles_failed", "Role update failed.")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"user_id": id, "roles": roleCodes(roles)})
}

func (h Handler) ListPullRequests(w http.ResponseWriter, r *http.Request) {
	if _, ok := h.requireAdmin(w, r); !ok {
		return
	}
	rows, err := h.prs.ListPullRequests(r.Context())
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "pull_requests_unavailable", "Pull requests are unavailable.")
		return
	}
	status := r.URL.Query().Get("status")
	dto := make([]pullrequests.PullRequestDTO, 0, len(rows))
	for _, pr := range rows {
		if status != "" && pr.Status != status {
			continue
		}
		dto = append(dto, pullrequests.ToDTO(requestBaseURL(r), pr))
	}
	httpx.WriteJSON(w, http.StatusOK, dto)
}

func (h Handler) PullRequestDetail(w http.ResponseWriter, r *http.Request) {
	if _, ok := h.requireAdmin(w, r); !ok {
		return
	}
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	pr, err := h.prs.GetPullRequest(r.Context(), id)
	if errors.Is(err, pullrequests.ErrNotFound) {
		writeNotFound(w)
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "pull_request_failed", "Pull request operation failed.")
		return
	}
	comments, _ := h.prs.ListComments(r.Context(), id)
	commentDTO := make([]pullrequests.CommentDTO, len(comments))
	for i, comment := range comments {
		commentDTO[i] = pullrequests.ToCommentDTO(comment)
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]any{"pull_request": pullrequests.ToDTO(requestBaseURL(r), pr), "comments": commentDTO})
}

func (h Handler) ApprovePullRequest(w http.ResponseWriter, r *http.Request) {
	h.moderatePullRequest(w, r, pullrequests.StatusApproved, "Pull request approved.")
}

func (h Handler) RejectPullRequest(w http.ResponseWriter, r *http.Request) {
	h.moderatePullRequest(w, r, pullrequests.StatusRejected, "Pull request rejected.")
}

func (h Handler) CancelPullRequest(w http.ResponseWriter, r *http.Request) {
	h.moderatePullRequest(w, r, pullrequests.StatusClosed, "Pull request cancelled.")
}

func (h Handler) moderatePullRequest(w http.ResponseWriter, r *http.Request, status string, detail string) {
	actor, ok := h.requireAdmin(w, r)
	if !ok {
		return
	}
	if !actor.Roles.IsSuperuser && !actor.Roles.IsBaseAdmin {
		writeForbidden(w)
		return
	}
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	approverID := actor.UserID
	if _, err := h.prs.UpdatePullRequestStatus(r.Context(), id, status, &approverID); err != nil {
		if errors.Is(err, pullrequests.ErrNotFound) {
			writeNotFound(w)
			return
		}
		httpx.WriteError(w, http.StatusInternalServerError, "pull_request_failed", "Pull request operation failed.")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]string{"detail": detail})
}

func (h Handler) ListComments(w http.ResponseWriter, r *http.Request) {
	if _, ok := h.requireAdmin(w, r); !ok {
		return
	}
	prID, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	rows, err := h.prs.ListComments(r.Context(), prID)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "comments_unavailable", "Comments are unavailable.")
		return
	}
	dto := make([]pullrequests.CommentDTO, len(rows))
	for i, comment := range rows {
		dto[i] = pullrequests.ToCommentDTO(comment)
	}
	httpx.WriteJSON(w, http.StatusOK, dto)
}

func (h Handler) CreateComment(w http.ResponseWriter, r *http.Request) {
	actor, ok := h.requireAdmin(w, r)
	if !ok {
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
		httpx.WriteError(w, http.StatusBadRequest, "validation_failed", "Text is required.")
		return
	}
	comment, err := h.prs.CreateComment(r.Context(), prID, pullrequests.Actor{
		UserID:      actor.UserID,
		IsSuperuser: actor.Roles.IsSuperuser,
		IsBaseAdmin: actor.Roles.IsBaseAdmin,
		IsEditor:    actor.Roles.IsEditor,
	}, input.Text)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "comment_failed", "Comment operation failed.")
		return
	}
	httpx.WriteJSON(w, http.StatusCreated, pullrequests.ToCommentDTO(comment))
}

func (h Handler) DeleteComment(w http.ResponseWriter, r *http.Request) {
	actor, ok := h.requireAdmin(w, r)
	if !ok {
		return
	}
	id, ok := parseID(w, r, "id")
	if !ok {
		return
	}
	comment, err := h.prs.GetComment(r.Context(), id)
	if errors.Is(err, pullrequests.ErrNotFound) {
		writeNotFound(w)
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "comment_failed", "Comment operation failed.")
		return
	}
	if !pullrequests.CanDeleteComment(pullrequests.Actor{
		UserID:      actor.UserID,
		IsSuperuser: actor.Roles.IsSuperuser,
		IsBaseAdmin: actor.Roles.IsBaseAdmin,
		IsEditor:    actor.Roles.IsEditor,
	}, comment) {
		writeForbidden(w)
		return
	}
	if err := h.prs.DeleteComment(r.Context(), id); err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "delete_failed", "Comment delete failed.")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

type resolvedActor struct {
	UserID int
	Roles  auth.RoleSet
}

func (h Handler) requireUserManager(w http.ResponseWriter, r *http.Request) (resolvedActor, bool) {
	actor, ok := h.requireAdmin(w, r)
	if !ok {
		return resolvedActor{}, false
	}
	if !actor.Roles.IsSuperuser && !actor.Roles.IsBaseAdmin {
		writeForbidden(w)
		return resolvedActor{}, false
	}
	return actor, true
}

func (h Handler) requireAdmin(w http.ResponseWriter, r *http.Request) (resolvedActor, bool) {
	if h.actor == nil {
		writeUnauthorized(w)
		return resolvedActor{}, false
	}
	actor, ok := h.actor(r)
	if !ok || actor.UserID == 0 {
		writeUnauthorized(w)
		return resolvedActor{}, false
	}
	if h.roles == nil {
		httpx.WriteError(w, http.StatusServiceUnavailable, "repository_unavailable", "Admin roles repository is not connected yet.")
		return resolvedActor{}, false
	}
	roles, err := h.roles.RolesForUser(r.Context(), actor.UserID)
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "roles_unavailable", "User roles are unavailable.")
		return resolvedActor{}, false
	}
	if !roles.IsSuperuser && !roles.IsBaseAdmin && !roles.IsEditor {
		writeForbidden(w)
		return resolvedActor{}, false
	}
	return resolvedActor{UserID: actor.UserID, Roles: roles}, true
}

func (h Handler) writeUserResult(w http.ResponseWriter, user users.User, err error) {
	if errors.Is(err, users.ErrNotFound) {
		writeNotFound(w)
		return
	}
	if err != nil {
		httpx.WriteError(w, http.StatusInternalServerError, "user_failed", "User operation failed.")
		return
	}
	httpx.WriteJSON(w, http.StatusOK, users.ToDTO(user))
}

func parseID(w http.ResponseWriter, r *http.Request, name string) (int, bool) {
	id, err := strconv.Atoi(chi.URLParam(r, name))
	if err != nil {
		writeNotFound(w)
		return 0, false
	}
	return id, true
}

func parseRoles(codes []string) (auth.RoleSet, bool) {
	var roles auth.RoleSet
	for _, code := range codes {
		switch code {
		case "superuser":
			roles.IsSuperuser = true
		case "base_admin":
			roles.IsBaseAdmin = true
		case "editor":
			roles.IsEditor = true
		default:
			return auth.RoleSet{}, false
		}
	}
	return roles, true
}

func roleCodes(roles auth.RoleSet) []string {
	var out []string
	if roles.IsSuperuser {
		out = append(out, "superuser")
	}
	if roles.IsBaseAdmin {
		out = append(out, "base_admin")
	}
	if roles.IsEditor {
		out = append(out, "editor")
	}
	return out
}

func writeUnauthorized(w http.ResponseWriter) {
	httpx.WriteError(w, http.StatusUnauthorized, "not_authenticated", "Authentication credentials were not provided.")
}

func writeForbidden(w http.ResponseWriter) {
	httpx.WriteError(w, http.StatusForbidden, "permission_denied", "You do not have permission to perform this action.")
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
