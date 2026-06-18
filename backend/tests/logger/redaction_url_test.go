package logger_test

import (
	"strings"
	"testing"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/platform/logger"
)

func TestRedactURLHidesTokenQuery(t *testing.T) {
	input := "/ws/api/pull_requests/1/comments/?token=secret.jwt.value&x=1"
	got := logger.RedactURL(input)
	if got == input {
		t.Fatalf("URL was not redacted")
	}
	if strings.Contains(got, "secret.jwt.value") {
		t.Fatalf("redacted URL leaked token: %s", got)
	}
	if !strings.Contains(got, "token=[REDACTED]") {
		t.Fatalf("redacted URL = %s", got)
	}
}
