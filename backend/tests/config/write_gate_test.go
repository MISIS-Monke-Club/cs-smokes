package config_test

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/config"
)

func TestLoadParsesWriteGateAndWebSocketDefaults(t *testing.T) {
	t.Setenv("DB_NAME", "database")
	t.Setenv("DB_USER", "SA_admin")
	t.Setenv("SECRET_KEY", "secret")
	t.Setenv("WRITE_GATE", "true")

	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("Load returned error: %v", err)
	}
	if !cfg.WriteGate {
		t.Fatalf("WriteGate = false, want true")
	}
	if cfg.WSAllowDevAnon {
		t.Fatalf("WSAllowDevAnon = true, want production-safe false default")
	}
}

func TestProductionExamplesKeepWriteGateClosed(t *testing.T) {
	repoRoot := filepath.Join("..", "..", "..")
	composeBytes, err := os.ReadFile(filepath.Join(repoRoot, "docker-compose.prod.yaml"))
	if err != nil {
		t.Fatalf("read production compose: %v", err)
	}
	envBytes, err := os.ReadFile(filepath.Join(repoRoot, ".env.example"))
	if err != nil {
		t.Fatalf("read env example: %v", err)
	}

	compose := string(composeBytes)
	envExample := string(envBytes)
	for _, expected := range []string{
		"WRITE_GATE=true",
		"WS_ALLOW_UNAUTHENTICATED_DEV=false",
	} {
		if !strings.Contains(compose, expected) {
			t.Fatalf("docker-compose.prod.yaml missing %s", expected)
		}
		if !strings.Contains(envExample, expected) {
			t.Fatalf(".env.example missing %s", expected)
		}
	}
}
