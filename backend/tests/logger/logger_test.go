package logger_test

import (
	"strings"
	"testing"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/platform/logger"
)

func TestRedactTokenQueryHidesRawToken(t *testing.T) {
	raw := "https://example.test/ws/api/pull_requests/1/comments/?token=sentinel.jwt.value&other=1"

	redacted := logger.RedactTokenQuery(raw)

	if strings.Contains(redacted, "sentinel.jwt.value") {
		t.Fatalf("redacted URL still contains raw token: %s", redacted)
	}
	if !strings.Contains(redacted, "token=[REDACTED]") {
		t.Fatalf("redacted URL = %s, want token redaction marker", redacted)
	}
}
