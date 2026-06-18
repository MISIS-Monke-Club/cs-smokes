package auth_test

import (
	"net/url"
	"testing"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/auth"
)

func TestTelegramSignatureRejectsMissingHash(t *testing.T) {
	if auth.CheckTelegramWebAppSignature("token", `user=%7B%22id%22%3A1%7D`) {
		t.Fatalf("missing hash must be rejected")
	}
}

func TestTelegramSignatureRejectsInvalidHash(t *testing.T) {
	initData := `user=%7B%22id%22%3A1%7D&hash=bad`
	if auth.CheckTelegramWebAppSignature("token", initData) {
		t.Fatalf("invalid hash must be rejected")
	}
}

func TestParseTelegramUserReadsUserPayload(t *testing.T) {
	encodedUser := url.QueryEscape(`{"id":123,"username":"player","first_name":"Play","last_name":"Er","photo_url":"https://example.test/a.png"}`)

	user, err := auth.ParseTelegramUser("user=" + encodedUser + "&hash=ignored")

	if err != nil {
		t.Fatalf("ParseTelegramUser returned error: %v", err)
	}
	if user.ID != 123 || user.Username != "player" || user.FirstName != "Play" {
		t.Fatalf("unexpected telegram user: %#v", user)
	}
}
