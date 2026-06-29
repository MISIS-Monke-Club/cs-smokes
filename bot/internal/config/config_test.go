package config

import "testing"

func TestLoadRejectsMissingToken(t *testing.T) {
	t.Setenv("TOKEN", "")
	t.Setenv("WEB_APP_URL", "https://example.com/app")

	if _, err := Load(); err == nil {
		t.Fatalf("expected missing TOKEN to fail")
	}
}

func TestLoadRejectsMissingWebAppURL(t *testing.T) {
	t.Setenv("TOKEN", "telegram-token")
	t.Setenv("WEB_APP_URL", "")

	if _, err := Load(); err == nil {
		t.Fatalf("expected missing WEB_APP_URL to fail")
	}
}

func TestLoadReadsRequiredValues(t *testing.T) {
	t.Setenv("TOKEN", "telegram-token")
	t.Setenv("WEB_APP_URL", "https://example.com/app")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load returned error: %v", err)
	}
	if cfg.Token != "telegram-token" {
		t.Fatalf("Token = %q", cfg.Token)
	}
	if cfg.WebAppURL != "https://example.com/app" {
		t.Fatalf("WebAppURL = %q", cfg.WebAppURL)
	}
}
