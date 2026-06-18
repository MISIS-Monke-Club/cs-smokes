package auth_test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/auth"
)

func TestTelegramLoginRejectsMissingInitData(t *testing.T) {
	handler := auth.NewHandler(nil, "secret", "telegram-token")
	request := httptest.NewRequest(http.MethodPost, "/api/login/tg/", strings.NewReader(`{}`))
	recorder := httptest.NewRecorder()

	handler.TelegramLogin(recorder, request)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusBadRequest)
	}
	if !strings.Contains(recorder.Body.String(), `"error":"init_data is required"`) {
		t.Fatalf("body = %s", recorder.Body.String())
	}
}

func TestTelegramLoginRejectsInvalidHash(t *testing.T) {
	handler := auth.NewHandler(nil, "secret", "telegram-token")
	body := `{"init_data":"user=%7B%22id%22%3A1%7D&hash=bad"}`
	request := httptest.NewRequest(http.MethodPost, "/api/login/tg/", strings.NewReader(body))
	recorder := httptest.NewRecorder()

	handler.TelegramLogin(recorder, request)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusBadRequest)
	}
	if !strings.Contains(recorder.Body.String(), `"error":"Invalid hash. Data has been tampered with."`) {
		t.Fatalf("body = %s", recorder.Body.String())
	}
}
