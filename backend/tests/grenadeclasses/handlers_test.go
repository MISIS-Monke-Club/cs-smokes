package grenadeclasses_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/grenadeclasses"
	"github.com/go-chi/chi/v5"
)

func TestGrenadeClassesListAndSlashReturnDTOs(t *testing.T) {
	repo := newClassRepo()
	router := chi.NewRouter()
	grenadeclasses.RegisterRoutes(router, grenadeclasses.NewHandler(repo))

	for _, path := range []string{"/api/grenade-classes", "/api/grenade-classes/"} {
		t.Run(path, func(t *testing.T) {
			recorder := perform(router, http.MethodGet, path, "")
			if recorder.Code != http.StatusOK {
				t.Fatalf("status = %d, body = %s", recorder.Code, recorder.Body.String())
			}
			var body []map[string]any
			decode(t, recorder, &body)
			if len(body) != 1 {
				t.Fatalf("len = %d, want 1", len(body))
			}
			assertClassDTO(t, body[0])
		})
	}
}

func TestGrenadeClassesCreateUpdatePatchAndDelete(t *testing.T) {
	repo := newClassRepo()
	router := chi.NewRouter()
	grenadeclasses.RegisterRoutes(router, grenadeclasses.NewHandler(repo))

	create := perform(router, http.MethodPost, "/api/grenade-classes", `{"name":"Flash","description":null,"price":200}`)
	if create.Code != http.StatusCreated {
		t.Fatalf("create status = %d, body = %s", create.Code, create.Body.String())
	}
	var created map[string]any
	decode(t, create, &created)
	assertClassDTO(t, created)

	for _, tc := range []struct {
		method string
		body   string
	}{
		{http.MethodPut, `{"name":"Smoke","description":"desc","price":300}`},
		{http.MethodPatch, `{"price":350}`},
	} {
		resp := perform(router, tc.method, "/api/grenade-classes/1", tc.body)
		if resp.Code != http.StatusOK {
			t.Fatalf("%s status = %d, body = %s", tc.method, resp.Code, resp.Body.String())
		}
	}

	deleteResp := perform(router, http.MethodDelete, "/api/grenade-classes/1", "")
	if deleteResp.Code != http.StatusNoContent || deleteResp.Body.Len() != 0 {
		t.Fatalf("delete status/body = %d/%q", deleteResp.Code, deleteResp.Body.String())
	}
}

func TestGrenadeClassesErrorsMatchLegacyVisibleShapes(t *testing.T) {
	repo := newClassRepo()
	router := chi.NewRouter()
	grenadeclasses.RegisterRoutes(router, grenadeclasses.NewHandler(repo))

	missing := perform(router, http.MethodGet, "/api/grenade-classes/404", "")
	if missing.Code != http.StatusNotFound || !strings.Contains(missing.Body.String(), `"detail":"Not found."`) {
		t.Fatalf("missing status/body = %d/%s", missing.Code, missing.Body.String())
	}

	validation := perform(router, http.MethodPost, "/api/grenade-classes", `{"name":"","price":-1}`)
	if validation.Code != http.StatusBadRequest {
		t.Fatalf("validation status = %d", validation.Code)
	}
	if !strings.Contains(validation.Body.String(), `"name"`) || !strings.Contains(validation.Body.String(), `"price"`) {
		t.Fatalf("validation body = %s", validation.Body.String())
	}
}

func assertClassDTO(t *testing.T, dto map[string]any) {
	t.Helper()
	for _, key := range []string{"grenade_class_id", "name", "description", "price"} {
		if _, ok := dto[key]; !ok {
			t.Fatalf("class dto missing %q: %#v", key, dto)
		}
	}
}

type fakeClassRepo struct {
	classes map[int]grenadeclasses.GrenadeClass
	next    int
}

func newClassRepo() *fakeClassRepo {
	return &fakeClassRepo{
		next: 2,
		classes: map[int]grenadeclasses.GrenadeClass{
			1: {GrenadeClassID: 1, Name: "Smoke", Description: ptr("desc"), Price: 300},
		},
	}
}

func (r *fakeClassRepo) ListGrenadeClasses(context.Context) ([]grenadeclasses.GrenadeClass, error) {
	return []grenadeclasses.GrenadeClass{r.classes[1]}, nil
}

func (r *fakeClassRepo) CreateGrenadeClass(_ context.Context, input grenadeclasses.Input) (grenadeclasses.GrenadeClass, error) {
	created := grenadeclasses.GrenadeClass{GrenadeClassID: r.next, Name: input.Name, Description: input.Description, Price: input.Price}
	r.classes[created.GrenadeClassID] = created
	r.next++
	return created, nil
}

func (r *fakeClassRepo) GetGrenadeClass(_ context.Context, id int) (grenadeclasses.GrenadeClass, error) {
	class, ok := r.classes[id]
	if !ok {
		return grenadeclasses.GrenadeClass{}, grenadeclasses.ErrNotFound
	}
	return class, nil
}

func (r *fakeClassRepo) ReplaceGrenadeClass(ctx context.Context, id int, input grenadeclasses.Input) (grenadeclasses.GrenadeClass, error) {
	return r.update(ctx, id, input)
}

func (r *fakeClassRepo) PatchGrenadeClass(ctx context.Context, id int, input grenadeclasses.Input) (grenadeclasses.GrenadeClass, error) {
	return r.update(ctx, id, input)
}

func (r *fakeClassRepo) DeleteGrenadeClass(_ context.Context, id int) error {
	if _, ok := r.classes[id]; !ok {
		return grenadeclasses.ErrNotFound
	}
	delete(r.classes, id)
	return nil
}

func (r *fakeClassRepo) update(_ context.Context, id int, input grenadeclasses.Input) (grenadeclasses.GrenadeClass, error) {
	class, ok := r.classes[id]
	if !ok {
		return grenadeclasses.GrenadeClass{}, grenadeclasses.ErrNotFound
	}
	if input.Name != "" {
		class.Name = input.Name
	}
	if input.Description != nil {
		class.Description = input.Description
	}
	if input.Price != 0 {
		class.Price = input.Price
	}
	r.classes[id] = class
	return class, nil
}

func perform(handler http.Handler, method string, path string, body string) *httptest.ResponseRecorder {
	request := httptest.NewRequest(method, path, strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
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

var _ grenadeclasses.Repository = (*fakeClassRepo)(nil)
