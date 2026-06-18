package pullrequests_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/grenadeclasses"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/lineups"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/pullrequests"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/users"
	"github.com/go-chi/chi/v5"
)

func TestPullRequestCRUDAndStatusEndpoints(t *testing.T) {
	repo := newPRRepo()
	router := chi.NewRouter()
	pullrequests.RegisterRoutes(router, pullrequests.NewHandler(repo, actorFromHeader))

	list := perform(router, http.MethodGet, "/api/pull_requests", "", "admin")
	if list.Code != http.StatusOK {
		t.Fatalf("list status = %d, body = %s", list.Code, list.Body.String())
	}
	var listBody []map[string]any
	decode(t, list, &listBody)
	assertPRDTO(t, listBody[0])

	create := perform(router, http.MethodPost, "/api/pull_requests", `{"lineup_id":1}`, "admin")
	if create.Code != http.StatusCreated {
		t.Fatalf("create status = %d, body = %s", create.Code, create.Body.String())
	}
	if !strings.Contains(create.Body.String(), `"lineup_id":1`) {
		t.Fatalf("create body must contain current create serializer lineup_id: %s", create.Body.String())
	}

	detail := perform(router, http.MethodGet, "/api/pull_requests/1", "", "admin")
	if detail.Code != http.StatusOK {
		t.Fatalf("detail status = %d, body = %s", detail.Code, detail.Body.String())
	}
	var detailBody map[string]any
	decode(t, detail, &detailBody)
	assertPRDTO(t, detailBody)

	patch := perform(router, http.MethodPatch, "/api/pull_requests/1", `{"status":"APPROVED","approver_id":2}`, "admin")
	if patch.Code != http.StatusOK {
		t.Fatalf("patch status = %d, body = %s", patch.Code, patch.Body.String())
	}

	for _, tc := range []struct {
		path   string
		role   string
		detail string
	}{
		{"/api/pull_requests/1/approve", "admin", "Pull request approved."},
		{"/api/pull_requests/1/reject", "admin", "Pull request rejected."},
		{"/api/pull_requests/1/cancel", "creator", "Pull request cancelled."},
	} {
		resp := perform(router, http.MethodPatch, tc.path, "", tc.role)
		if resp.Code != http.StatusOK || !strings.Contains(resp.Body.String(), tc.detail) {
			t.Fatalf("%s status/body = %d/%s", tc.path, resp.Code, resp.Body.String())
		}
	}

	deleteResp := perform(router, http.MethodDelete, "/api/pull_requests/1", "", "admin")
	if deleteResp.Code != http.StatusNoContent || deleteResp.Body.Len() != 0 {
		t.Fatalf("delete status/body = %d/%q", deleteResp.Code, deleteResp.Body.String())
	}
}

func TestPullRequestPermissionAndMethodErrors(t *testing.T) {
	repo := newPRRepo()
	router := chi.NewRouter()
	pullrequests.RegisterRoutes(router, pullrequests.NewHandler(repo, actorFromHeader))

	for _, path := range []string{"/api/pull_requests/1/approve", "/api/pull_requests/1/reject", "/api/pull_requests/1/cancel"} {
		resp := perform(router, http.MethodPatch, path, "", "editor")
		if resp.Code != http.StatusForbidden || !strings.Contains(resp.Body.String(), `"detail"`) {
			t.Fatalf("%s forbidden status/body = %d/%s", path, resp.Code, resp.Body.String())
		}
	}

	missing := perform(router, http.MethodGet, "/api/pull_requests/404", "", "admin")
	if missing.Code != http.StatusNotFound || !strings.Contains(missing.Body.String(), `"detail":"Not found."`) {
		t.Fatalf("missing status/body = %d/%s", missing.Code, missing.Body.String())
	}

	put := perform(router, http.MethodPut, "/api/pull_requests/1", `{"status":"OPEN"}`, "admin")
	if put.Code != http.StatusMethodNotAllowed {
		t.Fatalf("PUT status = %d, body = %s", put.Code, put.Body.String())
	}
}

func TestRESTCommentRoutes(t *testing.T) {
	repo := newPRRepo()
	router := chi.NewRouter()
	pullrequests.RegisterRoutes(router, pullrequests.NewHandler(repo, actorFromHeader))

	list := perform(router, http.MethodGet, "/api/pull_requests/1/comments", "", "admin")
	if list.Code != http.StatusOK {
		t.Fatalf("comments list status = %d, body = %s", list.Code, list.Body.String())
	}
	var comments []map[string]any
	decode(t, list, &comments)
	assertCommentDTO(t, comments[0])
	if comments[0]["created_at"].(string) > comments[1]["created_at"].(string) {
		t.Fatalf("comments are not ordered by created_at: %#v", comments)
	}

	create := perform(router, http.MethodPost, "/api/pull_requests/1/comments", `{"text":"looks good"}`, "admin")
	if create.Code != http.StatusCreated {
		t.Fatalf("comment create status = %d, body = %s", create.Code, create.Body.String())
	}
	var created map[string]any
	decode(t, create, &created)
	assertCommentDTO(t, created)

	invalid := perform(router, http.MethodPost, "/api/pull_requests/1/comments", `{}`, "admin")
	if invalid.Code != http.StatusBadRequest || !strings.Contains(invalid.Body.String(), `"text"`) {
		t.Fatalf("invalid comment status/body = %d/%s", invalid.Code, invalid.Body.String())
	}

	detail := perform(router, http.MethodGet, "/api/comments/1", "", "admin")
	if detail.Code != http.StatusOK {
		t.Fatalf("comment detail status = %d, body = %s", detail.Code, detail.Body.String())
	}
	patch := perform(router, http.MethodPatch, "/api/comments/1", `{"text":"updated"}`, "admin")
	if patch.Code != http.StatusOK {
		t.Fatalf("comment patch status = %d, body = %s", patch.Code, patch.Body.String())
	}
	deleteResp := perform(router, http.MethodDelete, "/api/comments/1", "", "admin")
	if deleteResp.Code != http.StatusNoContent {
		t.Fatalf("comment delete status = %d, body = %s", deleteResp.Code, deleteResp.Body.String())
	}
	put := perform(router, http.MethodPut, "/api/comments/1", `{"text":"updated"}`, "admin")
	if put.Code != http.StatusMethodNotAllowed {
		t.Fatalf("comment PUT status = %d", put.Code)
	}
}

func assertPRDTO(t *testing.T, dto map[string]any) {
	t.Helper()
	for _, key := range []string{"id", "lineup", "creator", "approver", "status", "created_at", "closed_at"} {
		if _, ok := dto[key]; !ok {
			t.Fatalf("pull request dto missing %q: %#v", key, dto)
		}
	}
}

func assertCommentDTO(t *testing.T, dto map[string]any) {
	t.Helper()
	for _, key := range []string{"id", "text", "creator", "created_at"} {
		if _, ok := dto[key]; !ok {
			t.Fatalf("comment dto missing %q: %#v", key, dto)
		}
	}
	creator := dto["creator"].(map[string]any)
	if _, ok := creator["role"]; !ok {
		t.Fatalf("comment creator missing role: %#v", creator)
	}
}

type fakePRRepo struct {
	requests map[int]pullrequests.PullRequest
	comments map[int]pullrequests.Comment
	nextPR   int
	nextC    int
}

func newPRRepo() *fakePRRepo {
	lineup := lineups.Lineup{
		UserID:       7,
		GrenadeID:    1,
		MapID:        1,
		Creator:      users.User{UserID: 7, Username: "creator"},
		CreatedAt:    "2026-01-01T00:00:00Z",
		Title:        "Window smoke",
		IsApproved:   true,
		GrenadeClass: grenadeclasses.GrenadeClass{GrenadeClassID: 1, Name: "Smoke", Price: 300},
	}
	return &fakePRRepo{
		nextPR: 2,
		nextC:  3,
		requests: map[int]pullrequests.PullRequest{
			1: {ID: 1, LineupID: 1, Lineup: lineup, CreatorID: 7, Creator: users.User{UserID: 7, Username: "creator"}, Status: "OPEN", CreatedAt: "2026-01-02T00:00:00Z"},
		},
		comments: map[int]pullrequests.Comment{
			1: {ID: 1, PullRequestID: 1, Text: "first", Creator: users.User{UserID: 7, Username: "creator"}, CreatorRole: "creator", CreatedAt: "2026-01-01T00:00:00Z"},
			2: {ID: 2, PullRequestID: 1, Text: "second", Creator: users.User{UserID: 2, Username: "admin"}, CreatorRole: "admin", CreatedAt: "2026-01-02T00:00:00Z"},
		},
	}
}

func (r *fakePRRepo) ListPullRequests(context.Context) ([]pullrequests.PullRequest, error) {
	return []pullrequests.PullRequest{r.requests[1]}, nil
}

func (r *fakePRRepo) CreatePullRequest(_ context.Context, actor pullrequests.Actor, lineupID int) (pullrequests.PullRequest, error) {
	if lineupID == 404 {
		return pullrequests.PullRequest{}, pullrequests.ErrNotFound
	}
	item := r.requests[1]
	item.ID = r.nextPR
	item.CreatorID = actor.UserID
	item.LineupID = lineupID
	item.Status = "OPEN"
	r.requests[item.ID] = item
	r.nextPR++
	return item, nil
}

func (r *fakePRRepo) GetPullRequest(_ context.Context, id int) (pullrequests.PullRequest, error) {
	item, ok := r.requests[id]
	if !ok {
		return pullrequests.PullRequest{}, pullrequests.ErrNotFound
	}
	return item, nil
}

func (r *fakePRRepo) UpdatePullRequestStatus(_ context.Context, id int, status string, approverID *int) (pullrequests.PullRequest, error) {
	item, ok := r.requests[id]
	if !ok {
		return pullrequests.PullRequest{}, pullrequests.ErrNotFound
	}
	item.Status = status
	item.ApproverID = approverID
	r.requests[id] = item
	return item, nil
}

func (r *fakePRRepo) DeletePullRequest(_ context.Context, id int) error {
	if _, ok := r.requests[id]; !ok {
		return pullrequests.ErrNotFound
	}
	delete(r.requests, id)
	return nil
}

func (r *fakePRRepo) ListComments(context.Context, int) ([]pullrequests.Comment, error) {
	return []pullrequests.Comment{r.comments[1], r.comments[2]}, nil
}

func (r *fakePRRepo) CreateComment(_ context.Context, prID int, actor pullrequests.Actor, text string) (pullrequests.Comment, error) {
	if prID == 404 {
		return pullrequests.Comment{}, pullrequests.ErrNotFound
	}
	item := pullrequests.Comment{ID: r.nextC, PullRequestID: prID, Text: text, Creator: users.User{UserID: actor.UserID, Username: "actor"}, CreatorRole: "admin", CreatedAt: "2026-01-03T00:00:00Z"}
	r.comments[item.ID] = item
	r.nextC++
	return item, nil
}

func (r *fakePRRepo) GetComment(_ context.Context, id int) (pullrequests.Comment, error) {
	item, ok := r.comments[id]
	if !ok {
		return pullrequests.Comment{}, pullrequests.ErrNotFound
	}
	return item, nil
}

func (r *fakePRRepo) UpdateComment(_ context.Context, id int, text string) (pullrequests.Comment, error) {
	item, ok := r.comments[id]
	if !ok {
		return pullrequests.Comment{}, pullrequests.ErrNotFound
	}
	item.Text = text
	r.comments[id] = item
	return item, nil
}

func (r *fakePRRepo) DeleteComment(_ context.Context, id int) error {
	if _, ok := r.comments[id]; !ok {
		return pullrequests.ErrNotFound
	}
	delete(r.comments, id)
	return nil
}

func actorFromHeader(r *http.Request) pullrequests.Actor {
	switch r.Header.Get("X-Test-Actor") {
	case "admin":
		return pullrequests.Actor{UserID: 2, IsBaseAdmin: true}
	case "editor":
		return pullrequests.Actor{UserID: 3, IsEditor: true}
	case "creator":
		return pullrequests.Actor{UserID: 7}
	default:
		return pullrequests.Actor{UserID: 99}
	}
}

func perform(handler http.Handler, method string, path string, body string, actor string) *httptest.ResponseRecorder {
	request := httptest.NewRequest(method, path, strings.NewReader(body))
	request.Host = "example.com"
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("X-Test-Actor", actor)
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, request)
	return recorder
}

func decode(t *testing.T, recorder *httptest.ResponseRecorder, target any) {
	t.Helper()
	if err := json.Unmarshal(recorder.Body.Bytes(), target); err != nil {
		t.Fatalf("decode %q: %v", recorder.Body.String(), err)
	}
}

var _ pullrequests.Repository = (*fakePRRepo)(nil)
