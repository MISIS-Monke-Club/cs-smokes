package httpserver_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/config"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/platform/httpserver"
)

func TestHealthRoutesReturnOK(t *testing.T) {
	server := httpserver.New(config.Config{HTTPAddr: ":8000"})

	for _, path := range []string{"/healthz", "/api/healthz", "/api/health"} {
		t.Run(path, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodGet, path, nil)
			recorder := httptest.NewRecorder()

			server.Handler.ServeHTTP(recorder, request)

			if recorder.Code != http.StatusOK {
				t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
			}
			var body map[string]string
			if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
				t.Fatalf("decode response: %v", err)
			}
			if body["status"] != "ok" {
				t.Fatalf("status body = %q, want ok", body["status"])
			}
		})
	}
}
