package config_test

import (
	"strings"
	"testing"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/config"
)

func TestLoadRequiresCoreValues(t *testing.T) {
	t.Setenv("DB_NAME", "")
	t.Setenv("DB_USER", "")
	t.Setenv("SECRET_KEY", "")

	_, err := config.Load()
	if err == nil {
		t.Fatalf("expected Load to reject missing DB_NAME, DB_USER, and SECRET_KEY")
	}
}

func TestLoadBuildsDatabaseURL(t *testing.T) {
	t.Setenv("DB_NAME", "database")
	t.Setenv("DB_USER", "SA_admin")
	t.Setenv("DB_PASSWORD", "12344321")
	t.Setenv("DB_HOST", "db")
	t.Setenv("DB_PORT", "5432")
	t.Setenv("SECRET_KEY", "secret")
	t.Setenv("TOKEN", "telegram-token")
	t.Setenv("REDIS_PASS", "redis-pass")

	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("Load returned error: %v", err)
	}
	if cfg.DatabaseURL == "" {
		t.Fatalf("DatabaseURL is empty")
	}
	if !strings.Contains(cfg.DatabaseURL, "SA_admin:12344321@db:5432/database") {
		t.Fatalf("DatabaseURL = %q, missing expected DSN components", cfg.DatabaseURL)
	}
	if cfg.HTTPAddr != ":8000" {
		t.Fatalf("HTTPAddr = %q, want :8000", cfg.HTTPAddr)
	}
}
