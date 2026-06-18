package httpserver_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/config"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/platform/httpserver"
)

func TestCORSPreflightAllowsConfiguredOrigin(t *testing.T) {
	server := httpserver.New(config.Config{
		HTTPAddr:       ":8000",
		AllowedOrigins: []string{"http://localhost:8000"},
	})
	request := httptest.NewRequest(http.MethodOptions, "/api/healthz", nil)
	request.Header.Set("Origin", "http://localhost:8000")
	request.Header.Set("Access-Control-Request-Method", http.MethodGet)
	recorder := httptest.NewRecorder()

	server.Handler.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusNoContent)
	}
	if got := recorder.Header().Get("Access-Control-Allow-Origin"); got != "http://localhost:8000" {
		t.Fatalf("Access-Control-Allow-Origin = %q, want configured origin", got)
	}
}
