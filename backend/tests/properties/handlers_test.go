package properties_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/properties"
	"github.com/go-chi/chi/v5"
)

func TestPropertiesCRUDAndRelationRoutes(t *testing.T) {
	repo := newPropertyRepo()
	router := chi.NewRouter()
	properties.RegisterRoutes(router, properties.NewHandler(repo))

	list := perform(router, http.MethodGet, "/api/properties", "")
	if list.Code != http.StatusOK {
		t.Fatalf("list status = %d, body = %s", list.Code, list.Body.String())
	}
	var listBody []map[string]any
	decode(t, list, &listBody)
	assertPropertyDTO(t, listBody[0])

	create := perform(router, http.MethodPost, "/api/properties", `{"name":"tickrate","value":"128"}`)
	if create.Code != http.StatusCreated {
		t.Fatalf("create status = %d, body = %s", create.Code, create.Body.String())
	}
	var created map[string]any
	decode(t, create, &created)
	assertPropertyDTO(t, created)

	for _, tc := range []struct {
		method string
		path   string
		body   string
		code   int
	}{
		{http.MethodGet, "/api/properties/1", "", http.StatusOK},
		{http.MethodPut, "/api/properties/1", `{"name":"tickrate","value":"64"}`, http.StatusOK},
		{http.MethodPatch, "/api/properties/1", `{"value":"128"}`, http.StatusOK},
		{http.MethodDelete, "/api/properties/1", "", http.StatusNoContent},
	} {
		resp := perform(router, tc.method, tc.path, tc.body)
		if resp.Code != tc.code {
			t.Fatalf("%s %s status = %d, body = %s", tc.method, tc.path, resp.Code, resp.Body.String())
		}
	}
}

func TestPropertyRelations(t *testing.T) {
	repo := newPropertyRepo()
	router := chi.NewRouter()
	properties.RegisterRoutes(router, properties.NewHandler(repo))

	list := perform(router, http.MethodGet, "/api/property-list?grenade_id=1", "")
	if list.Code != http.StatusOK {
		t.Fatalf("relation list status = %d, body = %s", list.Code, list.Body.String())
	}
	var body []map[string]any
	decode(t, list, &body)
	for _, key := range []string{"property_id", "grenade_id", "name", "value"} {
		if _, ok := body[0][key]; !ok {
			t.Fatalf("relation dto missing %q: %#v", key, body[0])
		}
	}

	create := perform(router, http.MethodPost, "/api/lineups/1/properties", `{"property_id":2}`)
	if create.Code != http.StatusCreated {
		t.Fatalf("relation create status = %d, body = %s", create.Code, create.Body.String())
	}

	deleteResp := perform(router, http.MethodDelete, "/api/lineups/1/properties/2", "")
	if deleteResp.Code != http.StatusNoContent || deleteResp.Body.Len() != 0 {
		t.Fatalf("relation delete status/body = %d/%q", deleteResp.Code, deleteResp.Body.String())
	}
}

func TestPropertyErrorsMatchLegacyVisibleShapes(t *testing.T) {
	repo := newPropertyRepo()
	router := chi.NewRouter()
	properties.RegisterRoutes(router, properties.NewHandler(repo))

	missing := perform(router, http.MethodGet, "/api/properties/404", "")
	if missing.Code != http.StatusNotFound || !strings.Contains(missing.Body.String(), `"detail":"Not found."`) {
		t.Fatalf("missing status/body = %d/%s", missing.Code, missing.Body.String())
	}

	invalid := perform(router, http.MethodPost, "/api/properties", `{"name":""}`)
	if invalid.Code != http.StatusBadRequest || !strings.Contains(invalid.Body.String(), `"name"`) {
		t.Fatalf("invalid status/body = %d/%s", invalid.Code, invalid.Body.String())
	}

	duplicate := perform(router, http.MethodPost, "/api/lineups/1/properties", `{"property_id":1}`)
	if duplicate.Code != http.StatusBadRequest || !strings.Contains(duplicate.Body.String(), `"non_field_errors"`) {
		t.Fatalf("duplicate relation status/body = %d/%s", duplicate.Code, duplicate.Body.String())
	}

	missingRelation := perform(router, http.MethodDelete, "/api/lineups/1/properties/404", "")
	if missingRelation.Code != http.StatusNotFound || !strings.Contains(missingRelation.Body.String(), `"detail":"Not found."`) {
		t.Fatalf("missing relation status/body = %d/%s", missingRelation.Code, missingRelation.Body.String())
	}
}

func assertPropertyDTO(t *testing.T, dto map[string]any) {
	t.Helper()
	for _, key := range []string{"property_id", "name", "value"} {
		if _, ok := dto[key]; !ok {
			t.Fatalf("property dto missing %q: %#v", key, dto)
		}
	}
}

type fakePropertyRepo struct {
	properties map[int]properties.Property
	relations  map[[2]int]properties.PropertyRelation
	next       int
}

func newPropertyRepo() *fakePropertyRepo {
	value := "128"
	return &fakePropertyRepo{
		next: 3,
		properties: map[int]properties.Property{
			1: {PropertyID: 1, Name: "tickrate", Value: &value},
			2: {PropertyID: 2, Name: "side", Value: nil},
		},
		relations: map[[2]int]properties.PropertyRelation{
			{1, 1}: {PropertyID: 1, GrenadeID: 1, Name: "tickrate", Value: &value},
		},
	}
}

func (r *fakePropertyRepo) ListProperties(context.Context) ([]properties.Property, error) {
	return []properties.Property{r.properties[1]}, nil
}

func (r *fakePropertyRepo) CreateProperty(_ context.Context, input properties.Input) (properties.Property, error) {
	if input.Name == "" {
		return properties.Property{}, properties.ValidationError{Fields: []string{"name"}}
	}
	item := properties.Property{PropertyID: r.next, Name: input.Name, Value: input.Value}
	r.properties[item.PropertyID] = item
	r.next++
	return item, nil
}

func (r *fakePropertyRepo) GetProperty(_ context.Context, id int) (properties.Property, error) {
	item, ok := r.properties[id]
	if !ok {
		return properties.Property{}, properties.ErrNotFound
	}
	return item, nil
}

func (r *fakePropertyRepo) ReplaceProperty(ctx context.Context, id int, input properties.Input) (properties.Property, error) {
	return r.update(ctx, id, input)
}

func (r *fakePropertyRepo) PatchProperty(ctx context.Context, id int, input properties.Input) (properties.Property, error) {
	return r.update(ctx, id, input)
}

func (r *fakePropertyRepo) DeleteProperty(_ context.Context, id int) error {
	if _, ok := r.properties[id]; !ok {
		return properties.ErrNotFound
	}
	delete(r.properties, id)
	return nil
}

func (r *fakePropertyRepo) ListPropertyRelations(_ context.Context, grenadeID *int) ([]properties.PropertyRelation, error) {
	return []properties.PropertyRelation{r.relations[[2]int{1, 1}]}, nil
}

func (r *fakePropertyRepo) CreateLineupProperty(_ context.Context, grenadeID int, propertyID int) (properties.PropertyRelation, error) {
	if propertyID == 1 {
		return properties.PropertyRelation{}, properties.DuplicateError{}
	}
	property, ok := r.properties[propertyID]
	if !ok {
		return properties.PropertyRelation{}, properties.ErrNotFound
	}
	relation := properties.PropertyRelation{PropertyID: propertyID, GrenadeID: grenadeID, Name: property.Name, Value: property.Value}
	r.relations[[2]int{propertyID, grenadeID}] = relation
	return relation, nil
}

func (r *fakePropertyRepo) DeleteLineupProperty(_ context.Context, grenadeID int, propertyID int) error {
	if _, ok := r.relations[[2]int{propertyID, grenadeID}]; !ok {
		return properties.ErrNotFound
	}
	delete(r.relations, [2]int{propertyID, grenadeID})
	return nil
}

func (r *fakePropertyRepo) update(_ context.Context, id int, input properties.Input) (properties.Property, error) {
	item, ok := r.properties[id]
	if !ok {
		return properties.Property{}, properties.ErrNotFound
	}
	if input.Name != "" {
		item.Name = input.Name
	}
	if input.Value != nil {
		item.Value = input.Value
	}
	r.properties[id] = item
	return item, nil
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

var _ properties.Repository = (*fakePropertyRepo)(nil)
