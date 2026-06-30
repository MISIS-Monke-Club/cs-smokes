package openapi_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/config"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/platform/httpserver"
)

func TestOpenAPIRoutesAreServed(t *testing.T) {
	server := httpserver.NewWithRepositories(config.Config{AllowedOrigins: []string{"*"}, SecretKey: "secret"}, httpserver.Repositories{})

	schema := httptest.NewRecorder()
	server.Handler.ServeHTTP(schema, httptest.NewRequest(http.MethodGet, "/api/schema", nil))
	if schema.Code != http.StatusOK {
		t.Fatalf("schema status = %d, body = %s", schema.Code, schema.Body.String())
	}
	var body map[string]any
	if err := json.Unmarshal(schema.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode schema: %v", err)
	}
	if body["openapi"] == "" || body["paths"] == nil {
		t.Fatalf("invalid schema body: %#v", body)
	}
	paths := body["paths"].(map[string]any)
	assertPathMethod(t, paths, "/api/lineups/{id}", "patch")
	assertPathMethod(t, paths, "/api/admin/lineups", "post")
	assertPathMethod(t, paths, "/api/pull_requests/{id}/comments", "post")
	assertPathMethod(t, paths, "/ws/api/pull_requests/{pr_id}/comments/", "get")

	components := body["components"].(map[string]any)
	schemas := components["schemas"].(map[string]any)
	assertNullableProperty(t, schemas, "Lineup", "description")
	assertNullableProperty(t, schemas, "LineupProperty", "value")
	assertNullableProperty(t, schemas, "GrenadeClass", "description")

	lineupPatch := requestBodySchema(t, paths, "/api/lineups/{id}", "patch")
	if lineupPatch["$ref"] != "#/components/schemas/LineupPatchInput" {
		t.Fatalf("lineup patch schema = %#v", lineupPatch)
	}
	prStatus := schemas["PullRequestStatus"].(map[string]any)
	if enum, ok := prStatus["enum"].([]any); !ok || len(enum) < 5 {
		t.Fatalf("pull request status enum = %#v", prStatus["enum"])
	}
	securitySchemes := components["securitySchemes"].(map[string]any)
	if _, ok := securitySchemes["BearerAuth"]; !ok {
		t.Fatalf("missing BearerAuth scheme: %#v", securitySchemes)
	}

	docs := httptest.NewRecorder()
	server.Handler.ServeHTTP(docs, httptest.NewRequest(http.MethodGet, "/api/docs", nil))
	if docs.Code != http.StatusOK || !strings.Contains(docs.Body.String(), "/api/schema") {
		t.Fatalf("docs status/body = %d/%s", docs.Code, docs.Body.String())
	}
}

func assertPathMethod(t *testing.T, paths map[string]any, path string, method string) {
	t.Helper()
	item, ok := paths[path].(map[string]any)
	if !ok {
		t.Fatalf("missing path %s", path)
	}
	if _, ok := item[method].(map[string]any); !ok {
		t.Fatalf("missing %s %s operation: %#v", method, path, item)
	}
}

func assertNullableProperty(t *testing.T, schemas map[string]any, schemaName string, propertyName string) {
	t.Helper()
	schema := schemas[schemaName].(map[string]any)
	properties := schema["properties"].(map[string]any)
	property := properties[propertyName].(map[string]any)
	if property["nullable"] != true {
		t.Fatalf("%s.%s should be nullable: %#v", schemaName, propertyName, property)
	}
}

func requestBodySchema(t *testing.T, paths map[string]any, path string, method string) map[string]any {
	t.Helper()
	operation := paths[path].(map[string]any)[method].(map[string]any)
	body := operation["requestBody"].(map[string]any)
	content := body["content"].(map[string]any)
	mediaType := content["multipart/form-data"].(map[string]any)
	return mediaType["schema"].(map[string]any)
}
