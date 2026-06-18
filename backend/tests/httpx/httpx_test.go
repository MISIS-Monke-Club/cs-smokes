package httpx_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/platform/httpx"
)

func TestWriteErrorUsesStableJSONShape(t *testing.T) {
	recorder := httptest.NewRecorder()

	httpx.WriteError(recorder, http.StatusBadRequest, "invalid_request", "Bad request")

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusBadRequest)
	}
	var body map[string]string
	if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if body["error"] != "invalid_request" || body["detail"] != "Bad request" {
		t.Fatalf("body = %#v, want stable error/detail fields", body)
	}
}

func TestRecovererConvertsPanicToInternalError(t *testing.T) {
	handler := httpx.Recoverer(http.HandlerFunc(func(_ http.ResponseWriter, _ *http.Request) {
		panic("boom")
	}))
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/panic", nil)

	handler.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusInternalServerError)
	}
}
