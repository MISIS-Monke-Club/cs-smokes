package maps_test

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

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/maps"
	"github.com/go-chi/chi/v5"
)

func TestMapsListParsesFiltersAndReturnsDTOs(t *testing.T) {
	repo := newMapRepo()
	router := chi.NewRouter()
	maps.RegisterRoutes(router, maps.NewHandler(repo, t.TempDir()))

	recorder := perform(router, http.MethodGet, "/api/maps?ordering=by_alphabet&is_esports_pool=true&query=mirage", nil, "")
	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", recorder.Code, recorder.Body.String())
	}
	if repo.lastFilter.Ordering != "by_alphabet" || repo.lastFilter.Query != "mirage" || repo.lastFilter.IsEsportsPool == nil || !*repo.lastFilter.IsEsportsPool {
		t.Fatalf("filter = %#v", repo.lastFilter)
	}
	var body []map[string]any
	decode(t, recorder, &body)
	assertMapDTO(t, body[0])
}

func TestMapsDetailIncludesLineupsAndAbsoluteImageURL(t *testing.T) {
	repo := newMapRepo()
	router := chi.NewRouter()
	maps.RegisterRoutes(router, maps.NewHandler(repo, t.TempDir()))

	recorder := perform(router, http.MethodGet, "/api/maps/1", nil, "")
	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", recorder.Code, recorder.Body.String())
	}
	var body map[string]any
	decode(t, recorder, &body)
	assertMapDTO(t, body)
	if _, ok := body["map_lineups"]; !ok {
		t.Fatalf("detail missing map_lineups: %#v", body)
	}
	if !strings.HasPrefix(body["image_link"].(string), "http://example.com/media/maps/") {
		t.Fatalf("image_link = %#v", body["image_link"])
	}
}

func TestMapsMultipartCreateUpdatePatchAndDelete(t *testing.T) {
	repo := newMapRepo()
	router := chi.NewRouter()
	root := t.TempDir()
	maps.RegisterRoutes(router, maps.NewHandler(repo, root))

	create := multipartRequest(t, http.MethodPost, "/api/maps", map[string]string{"name": "Cache", "link": "https://example.test/cache", "is_esports_pool": "true"})
	createResp := perform(router, create.Method, create.URL.String(), create.Body, create.Header.Get("Content-Type"))
	if createResp.Code != http.StatusCreated {
		t.Fatalf("create status = %d, body = %s", createResp.Code, createResp.Body.String())
	}

	put := multipartRequest(t, http.MethodPut, "/api/maps/1", map[string]string{"name": "Mirage", "is_esports_pool": "false"})
	putResp := perform(router, put.Method, put.URL.String(), put.Body, put.Header.Get("Content-Type"))
	if putResp.Code != http.StatusOK {
		t.Fatalf("put status = %d, body = %s", putResp.Code, putResp.Body.String())
	}

	patch := multipartRequest(t, http.MethodPatch, "/api/maps/1", map[string]string{"name": "Mirage patched"})
	patchResp := perform(router, patch.Method, patch.URL.String(), patch.Body, patch.Header.Get("Content-Type"))
	if patchResp.Code != http.StatusOK {
		t.Fatalf("patch status = %d, body = %s", patchResp.Code, patchResp.Body.String())
	}

	deleteResp := perform(router, http.MethodDelete, "/api/maps/1", nil, "")
	if deleteResp.Code != http.StatusNoContent || deleteResp.Body.Len() != 0 {
		t.Fatalf("delete status/body = %d/%q", deleteResp.Code, deleteResp.Body.String())
	}
	if !repo.cacheInvalidated {
		t.Fatalf("delete did not invalidate cache")
	}
}

func TestMapsErrorsMatchLegacyVisibleShapes(t *testing.T) {
	repo := newMapRepo()
	router := chi.NewRouter()
	maps.RegisterRoutes(router, maps.NewHandler(repo, t.TempDir()))

	missing := perform(router, http.MethodGet, "/api/maps/404", nil, "")
	if missing.Code != http.StatusNotFound || !strings.Contains(missing.Body.String(), `"detail":"Not found."`) {
		t.Fatalf("missing status/body = %d/%s", missing.Code, missing.Body.String())
	}

	invalid := multipartRequest(t, http.MethodPost, "/api/maps", map[string]string{"name": ""})
	invalidResp := perform(router, invalid.Method, invalid.URL.String(), invalid.Body, invalid.Header.Get("Content-Type"))
	if invalidResp.Code != http.StatusBadRequest || !strings.Contains(invalidResp.Body.String(), `"name"`) {
		t.Fatalf("invalid status/body = %d/%s", invalidResp.Code, invalidResp.Body.String())
	}
}

func assertMapDTO(t *testing.T, dto map[string]any) {
	t.Helper()
	for _, key := range []string{"map_id", "name", "link", "is_esports_pool", "image_link"} {
		if _, ok := dto[key]; !ok {
			t.Fatalf("map dto missing %q: %#v", key, dto)
		}
	}
}

type fakeMapRepo struct {
	maps             map[int]maps.Map
	lastFilter       maps.Filter
	cacheInvalidated bool
	next             int
}

func newMapRepo() *fakeMapRepo {
	imagePath := "maps/mirage.png"
	return &fakeMapRepo{
		next: 2,
		maps: map[int]maps.Map{
			1: {MapID: 1, Name: "Mirage", IsEsportsPool: true, ImagePath: &imagePath, MapLineups: []any{map[string]any{"grenade_id": 1}}},
		},
	}
}

func (r *fakeMapRepo) ListMaps(_ context.Context, filter maps.Filter) ([]maps.Map, error) {
	r.lastFilter = filter
	return []maps.Map{r.maps[1]}, nil
}

func (r *fakeMapRepo) CreateMap(_ context.Context, input maps.Input) (maps.Map, error) {
	if input.Name == "" {
		return maps.Map{}, maps.ValidationError{Fields: []string{"name"}}
	}
	created := maps.Map{MapID: r.next, Name: input.Name, Link: input.Link, IsEsportsPool: input.IsEsportsPool, ImagePath: input.ImagePath}
	r.maps[created.MapID] = created
	r.next++
	return created, nil
}

func (r *fakeMapRepo) GetMap(_ context.Context, id int) (maps.Map, error) {
	item, ok := r.maps[id]
	if !ok {
		return maps.Map{}, maps.ErrNotFound
	}
	return item, nil
}

func (r *fakeMapRepo) ReplaceMap(ctx context.Context, id int, input maps.Input) (maps.Map, error) {
	return r.update(ctx, id, input)
}

func (r *fakeMapRepo) PatchMap(ctx context.Context, id int, input maps.Input) (maps.Map, error) {
	return r.update(ctx, id, input)
}

func (r *fakeMapRepo) DeleteMap(_ context.Context, id int) error {
	if _, ok := r.maps[id]; !ok {
		return maps.ErrNotFound
	}
	delete(r.maps, id)
	r.cacheInvalidated = true
	return nil
}

func (r *fakeMapRepo) update(_ context.Context, id int, input maps.Input) (maps.Map, error) {
	item, ok := r.maps[id]
	if !ok {
		return maps.Map{}, maps.ErrNotFound
	}
	if input.Name != "" {
		item.Name = input.Name
	}
	item.Link = input.Link
	item.IsEsportsPool = input.IsEsportsPool
	if input.ImagePath != nil {
		item.ImagePath = input.ImagePath
	}
	r.maps[id] = item
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
	file, err := writer.CreateFormFile("image_link", "mirage.png")
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
	var reader io.Reader
	if body == nil {
		reader = bytes.NewReader(nil)
	} else {
		reader = body
	}
	request := httptest.NewRequest(method, path, reader)
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

var _ maps.Repository = (*fakeMapRepo)(nil)
