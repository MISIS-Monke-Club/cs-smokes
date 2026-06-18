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

	docs := httptest.NewRecorder()
	server.Handler.ServeHTTP(docs, httptest.NewRequest(http.MethodGet, "/api/docs", nil))
	if docs.Code != http.StatusOK || !strings.Contains(docs.Body.String(), "/api/schema") {
		t.Fatalf("docs status/body = %d/%s", docs.Code, docs.Body.String())
	}
}
