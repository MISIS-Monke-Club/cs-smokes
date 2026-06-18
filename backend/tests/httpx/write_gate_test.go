package httpx_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/platform/httpx"
)

func TestWriteGateBlocksUnsafeMethods(t *testing.T) {
	for _, path := range []string{"/api/lineups", "/api/admin/maps"} {
		for _, method := range []string{http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete} {
			t.Run(method+" "+path, func(t *testing.T) {
				recorder := performWriteGateRequest(true, method, path)

				if recorder.Code != http.StatusServiceUnavailable {
					t.Fatalf("status = %d, want %d", recorder.Code, http.StatusServiceUnavailable)
				}
				var body map[string]string
				if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
					t.Fatalf("decode response: %v", err)
				}
				if body["error"] != "write_gate_enabled" {
					t.Fatalf("error = %q, want write_gate_enabled", body["error"])
				}
				if body["detail"] != "Writes are temporarily disabled during migration." {
					t.Fatalf("detail = %q, want migration detail", body["detail"])
				}
			})
		}
	}
}

func TestWriteGateAllowsSafeMethodsAndHealth(t *testing.T) {
	for _, method := range []string{http.MethodGet, http.MethodHead, http.MethodOptions} {
		t.Run(method, func(t *testing.T) {
			recorder := performWriteGateRequest(true, method, "/api/lineups")
			if recorder.Code != http.StatusNoContent {
				t.Fatalf("status = %d, want pass-through 204", recorder.Code)
			}
		})
	}

	recorder := performWriteGateRequest(true, http.MethodPost, "/api/health")
	if recorder.Code != http.StatusNoContent {
		t.Fatalf("health status = %d, want pass-through 204", recorder.Code)
	}
}

func TestWriteGateDisabledAllowsUnsafeMethods(t *testing.T) {
	recorder := performWriteGateRequest(false, http.MethodPost, "/api/lineups")
	if recorder.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want pass-through 204", recorder.Code)
	}
}

func performWriteGateRequest(enabled bool, method string, path string) *httptest.ResponseRecorder {
	next := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})
	handler := httpx.WriteGate(enabled)(next)
	request := httptest.NewRequest(method, path, nil)
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, request)
	return recorder
}
