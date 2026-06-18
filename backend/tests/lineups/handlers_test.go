package lineups_test

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/grenadeclasses"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/lineups"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/users"
	"github.com/go-chi/chi/v5"
)

func TestLineupsListDetailAndDerivedFields(t *testing.T) {
	repo := newLineupRepo()
	router := chi.NewRouter()
	lineups.RegisterRoutes(router, lineups.NewHandler(repo, t.TempDir()))

	list := perform(router, http.MethodGet, "/api/lineups?is_approved=true&ordering=by_alphabet&query=window&by_user_name=player&creator_id=999", nil, "")
	if list.Code != http.StatusOK {
		t.Fatalf("list status = %d, body = %s", list.Code, list.Body.String())
	}
	if repo.lastFilter.Query != "window" || repo.lastFilter.ByUserName != "player" || repo.lastFilter.CreatorIDIgnored != "" {
		t.Fatalf("filter = %#v", repo.lastFilter)
	}
	var listBody []map[string]any
	decode(t, list, &listBody)
	assertLineupDTO(t, listBody[0])

	detail := perform(router, http.MethodGet, "/api/lineups/1", nil, "")
	if detail.Code != http.StatusOK {
		t.Fatalf("detail status = %d, body = %s", detail.Code, detail.Body.String())
	}
	var detailBody map[string]any
	decode(t, detail, &detailBody)
	assertLineupDTO(t, detailBody)
	request := detailBody["request"].(map[string]any)
	if request["request_id"] != nil || request["status"] != "WAITING FOR CREATION" {
		t.Fatalf("request = %#v", request)
	}
	if !strings.HasPrefix(detailBody["preview_image_link"].(string), "http://example.com/media/lineups/") {
		t.Fatalf("preview_image_link = %#v", detailBody["preview_image_link"])
	}
}

func TestLineupsMultipartCreateUpdatePatchDelete(t *testing.T) {
	repo := newLineupRepo()
	router := chi.NewRouter()
	lineups.RegisterRoutes(router, lineups.NewHandler(repo, t.TempDir()))

	create := multipartRequest(t, http.MethodPost, "/api/lineups", map[string]string{
		"map_id":           "1",
		"user_id":          "1",
		"grenade_class_id": "1",
		"title":            "Window smoke",
		"description":      "line up with crosshair",
		"is_approved":      "true",
		"views":            "10",
		"link_to_video":    "https://example.test/video",
	})
	createResp := perform(router, create.Method, create.URL.String(), create.Body, create.Header.Get("Content-Type"))
	if createResp.Code != http.StatusCreated {
		t.Fatalf("create status = %d, body = %s", createResp.Code, createResp.Body.String())
	}

	put := multipartRequest(t, http.MethodPut, "/api/lineups/1", map[string]string{
		"map_id":           "1",
		"user_id":          "1",
		"grenade_class_id": "1",
		"title":            "Window smoke updated",
	})
	putResp := perform(router, put.Method, put.URL.String(), put.Body, put.Header.Get("Content-Type"))
	if putResp.Code != http.StatusOK {
		t.Fatalf("put status = %d, body = %s", putResp.Code, putResp.Body.String())
	}

	patch := multipartRequest(t, http.MethodPatch, "/api/lineups/1", map[string]string{"title": "Window smoke patched"})
	patchResp := perform(router, patch.Method, patch.URL.String(), patch.Body, patch.Header.Get("Content-Type"))
	if patchResp.Code != http.StatusOK {
		t.Fatalf("patch status = %d, body = %s", patchResp.Code, patchResp.Body.String())
	}

	deleteResp := perform(router, http.MethodDelete, "/api/lineups/1", nil, "")
	if deleteResp.Code != http.StatusNoContent || deleteResp.Body.Len() != 0 {
		t.Fatalf("delete status/body = %d/%q", deleteResp.Code, deleteResp.Body.String())
	}
}

func TestLineupsAuxiliaryRoutesAndChangeClass(t *testing.T) {
	repo := newLineupRepo()
	router := chi.NewRouter()
	lineups.RegisterRoutes(router, lineups.NewHandler(repo, t.TempDir()))

	filters := perform(router, http.MethodGet, "/api/lineups/view_filters", nil, "")
	if filters.Code != http.StatusOK || !strings.Contains(filters.Body.String(), `"is_approved":["true","false"]`) {
		t.Fatalf("filters status/body = %d/%s", filters.Code, filters.Body.String())
	}
	sorts := perform(router, http.MethodGet, "/api/lineups/view_sorts", nil, "")
	if sorts.Code != http.StatusOK || !strings.Contains(sorts.Body.String(), `"ordering":["date_of_creation","-date_of_creation","by_alphabet","-by_alphabet"]`) {
		t.Fatalf("sorts status/body = %d/%s", sorts.Code, sorts.Body.String())
	}

	change := perform(router, http.MethodPatch, "/api/lineups/1/change-grenade-class", strings.NewReader(`{"grenade_class_id":2}`), "application/json")
	if change.Code != http.StatusOK {
		t.Fatalf("change status = %d, body = %s", change.Code, change.Body.String())
	}
	missingBody := perform(router, http.MethodPatch, "/api/lineups/1/change-grenade-class", strings.NewReader(`{}`), "application/json")
	if missingBody.Code != http.StatusBadRequest || !strings.Contains(missingBody.Body.String(), `"grenade_class_id"`) {
		t.Fatalf("missing class status/body = %d/%s", missingBody.Code, missingBody.Body.String())
	}
	unknownClass := perform(router, http.MethodPatch, "/api/lineups/1/change-grenade-class", strings.NewReader(`{"grenade_class_id":404}`), "application/json")
	if unknownClass.Code != http.StatusNotFound || !strings.Contains(unknownClass.Body.String(), `"detail":"Not found."`) {
		t.Fatalf("unknown class status/body = %d/%s", unknownClass.Code, unknownClass.Body.String())
	}
}

func TestLineupsErrorsMatchLegacyVisibleShapes(t *testing.T) {
	repo := newLineupRepo()
	router := chi.NewRouter()
	lineups.RegisterRoutes(router, lineups.NewHandler(repo, t.TempDir()))

	missing := perform(router, http.MethodGet, "/api/lineups/404", nil, "")
	if missing.Code != http.StatusNotFound || !strings.Contains(missing.Body.String(), `"detail":"Not found."`) {
		t.Fatalf("missing status/body = %d/%s", missing.Code, missing.Body.String())
	}

	invalid := multipartRequest(t, http.MethodPost, "/api/lineups", map[string]string{"title": ""})
	invalidResp := perform(router, invalid.Method, invalid.URL.String(), invalid.Body, invalid.Header.Get("Content-Type"))
	if invalidResp.Code != http.StatusBadRequest || !strings.Contains(invalidResp.Body.String(), `"title"`) {
		t.Fatalf("invalid status/body = %d/%s", invalidResp.Code, invalidResp.Body.String())
	}
}

func assertLineupDTO(t *testing.T, dto map[string]any) {
	t.Helper()
	for _, key := range []string{"user_id", "grenade_id", "map_id", "link_to_video", "creator", "created_at", "title", "description", "is_approved", "is_favorite", "views", "preview_image_link", "grenade_class", "property_list", "request"} {
		if _, ok := dto[key]; !ok {
			t.Fatalf("lineup dto missing %q: %#v", key, dto)
		}
	}
}

type fakeLineupRepo struct {
	lineups    map[int]lineups.Lineup
	lastFilter lineups.Filter
	next       int
}

func newLineupRepo() *fakeLineupRepo {
	preview := "lineups/window.png"
	description := "desc"
	link := "https://example.test/video"
	return &fakeLineupRepo{
		next: 2,
		lineups: map[int]lineups.Lineup{
			1: {
				UserID:           1,
				GrenadeID:        1,
				MapID:            1,
				LinkToVideo:      &link,
				Creator:          users.User{UserID: 1, Username: "player", AvatarURL: ptr("avatar.png"), FirstName: ptr("Play"), LastName: ptr("Er")},
				CreatedAt:        "2026-01-01T00:00:00Z",
				Title:            "Window smoke",
				Description:      &description,
				IsApproved:       true,
				IsFavorite:       false,
				Views:            10,
				PreviewImagePath: &preview,
				GrenadeClass:     grenadeclasses.GrenadeClass{GrenadeClassID: 1, Name: "Smoke", Description: ptr("desc"), Price: 300},
				PropertyList:     []lineups.PropertyInline{{PropertyID: 1, Name: "tickrate", Value: ptr("128")}},
			},
		},
	}
}

func (r *fakeLineupRepo) ListLineups(_ context.Context, filter lineups.Filter) ([]lineups.Lineup, error) {
	r.lastFilter = filter
	return []lineups.Lineup{r.lineups[1]}, nil
}

func (r *fakeLineupRepo) CreateLineup(_ context.Context, input lineups.Input) (lineups.Lineup, error) {
	if input.Title == "" {
		return lineups.Lineup{}, lineups.ValidationError{Fields: []string{"title"}}
	}
	item := r.lineups[1]
	item.GrenadeID = r.next
	item.Title = input.Title
	item.MapID = input.MapID
	item.UserID = input.UserID
	item.GrenadeClass.GrenadeClassID = input.GrenadeClassID
	item.PreviewImagePath = input.PreviewImagePath
	r.lineups[item.GrenadeID] = item
	r.next++
	return item, nil
}

func (r *fakeLineupRepo) GetLineup(_ context.Context, id int) (lineups.Lineup, error) {
	item, ok := r.lineups[id]
	if !ok {
		return lineups.Lineup{}, lineups.ErrNotFound
	}
	return item, nil
}

func (r *fakeLineupRepo) ReplaceLineup(ctx context.Context, id int, input lineups.Input) (lineups.Lineup, error) {
	return r.update(ctx, id, input)
}

func (r *fakeLineupRepo) PatchLineup(ctx context.Context, id int, input lineups.Input) (lineups.Lineup, error) {
	return r.update(ctx, id, input)
}

func (r *fakeLineupRepo) DeleteLineup(_ context.Context, id int) error {
	if _, ok := r.lineups[id]; !ok {
		return lineups.ErrNotFound
	}
	delete(r.lineups, id)
	return nil
}

func (r *fakeLineupRepo) ChangeGrenadeClass(_ context.Context, id int, classID int) (lineups.Lineup, error) {
	if classID == 404 {
		return lineups.Lineup{}, lineups.ErrNotFound
	}
	item, ok := r.lineups[id]
	if !ok {
		return lineups.Lineup{}, lineups.ErrNotFound
	}
	item.GrenadeClass.GrenadeClassID = classID
	r.lineups[id] = item
	return item, nil
}

func (r *fakeLineupRepo) update(_ context.Context, id int, input lineups.Input) (lineups.Lineup, error) {
	item, ok := r.lineups[id]
	if !ok {
		return lineups.Lineup{}, lineups.ErrNotFound
	}
	if input.Title != "" {
		item.Title = input.Title
	}
	if input.PreviewImagePath != nil {
		item.PreviewImagePath = input.PreviewImagePath
	}
	r.lineups[id] = item
	return item, nil
}

func multipartRequest(t *testing.T, method string, path string, fields map[string]string) *http.Request {
	t.Helper()
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	for key, value := range fields {
		if err := writer.WriteField(key, value); err != nil {
			t.Fatalf("write field: %v", err)
		}
	}
	file, err := writer.CreateFormFile("preview_image_link", "window.png")
	if err != nil {
		t.Fatalf("create file: %v", err)
	}
	_, _ = file.Write([]byte("png"))
	if err := writer.Close(); err != nil {
		t.Fatalf("close multipart: %v", err)
	}
	request := httptest.NewRequest(method, path, &body)
	request.Header.Set("Content-Type", writer.FormDataContentType())
	return request
}

func perform(handler http.Handler, method string, path string, body io.Reader, contentType string) *httptest.ResponseRecorder {
	if body == nil {
		body = bytes.NewReader(nil)
	}
	request := httptest.NewRequest(method, path, body)
	request.Host = "example.com"
	if contentType != "" {
		request.Header.Set("Content-Type", contentType)
	}
	request.Header.Set("Authorization", "Bearer test")
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

func ptr(value string) *string {
	return &value
}

var _ lineups.Repository = (*fakeLineupRepo)(nil)
