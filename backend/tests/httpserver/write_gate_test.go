package httpserver_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/config"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/platform/httpserver"
)

func TestServerWriteGateBlocksUnsafePublicWrites(t *testing.T) {
	server := httpserver.New(config.Config{HTTPAddr: ":8000", WriteGate: true})
	request := httptest.NewRequest(http.MethodPost, "/api/lineups", nil)
	recorder := httptest.NewRecorder()

	server.Handler.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusServiceUnavailable)
	}
}

func TestServerWriteGateKeepsHealthReadable(t *testing.T) {
	server := httpserver.New(config.Config{HTTPAddr: ":8000", WriteGate: true})
	request := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	recorder := httptest.NewRecorder()

	server.Handler.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusOK)
	}
}
