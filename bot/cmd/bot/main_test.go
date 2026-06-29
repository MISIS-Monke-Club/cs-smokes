package main

import (
	"context"
	"errors"
	"net/http"
	"testing"

	"github.com/MISIS-Monke-Club/cs-smokes/bot/internal/config"
	"github.com/MISIS-Monke-Club/cs-smokes/bot/internal/telegram"
)

func TestMainCallsRun(t *testing.T) {
	originalRun := run
	defer func() { run = originalRun }()

	called := false
	run = func(ctx context.Context) error {
		called = true
		return nil
	}

	main()

	if !called {
		t.Fatalf("main did not call run")
	}
}

func TestMainIgnoresContextCanceled(t *testing.T) {
	originalRun := run
	originalFatalf := fatalf
	defer func() {
		run = originalRun
		fatalf = originalFatalf
	}()

	run = func(ctx context.Context) error {
		return context.Canceled
	}
	fatalf = func(format string, v ...any) {
		t.Fatalf("fatalf called with %q", format)
	}

	main()
}

func TestMainReportsRunError(t *testing.T) {
	originalRun := run
	originalFatalf := fatalf
	defer func() {
		run = originalRun
		fatalf = originalFatalf
	}()

	wantErr := errors.New("poll failed")
	run = func(ctx context.Context) error {
		return wantErr
	}

	called := false
	fatalf = func(format string, v ...any) {
		called = true
		if format != "poll telegram updates: %v" {
			t.Fatalf("format = %q", format)
		}
		if len(v) != 1 || !errors.Is(v[0].(error), wantErr) {
			t.Fatalf("fatal args = %#v", v)
		}
	}

	main()

	if !called {
		t.Fatalf("fatalf was not called")
	}
}

func TestRunReturnsConfigError(t *testing.T) {
	originalLoadConfig := loadConfig
	defer func() { loadConfig = originalLoadConfig }()

	wantErr := errors.New("bad config")
	loadConfig = func() (config.Config, error) {
		return config.Config{}, wantErr
	}

	err := run(context.Background())
	if !errors.Is(err, wantErr) {
		t.Fatalf("run error = %v, want %v", err, wantErr)
	}
}

func TestRunWiresTelegramClientAndPoller(t *testing.T) {
	originalLoadConfig := loadConfig
	originalNewClient := newClient
	originalNewHandler := newHandler
	originalPollUpdates := pollUpdates
	defer func() {
		loadConfig = originalLoadConfig
		newClient = originalNewClient
		newHandler = originalNewHandler
		pollUpdates = originalPollUpdates
	}()

	loadConfig = func() (config.Config, error) {
		return config.Config{Token: "token", WebAppURL: "https://example.com/app"}, nil
	}

	var gotToken string
	var gotAPIURL string
	newClient = func(token string, apiURL string, httpClient *http.Client) *telegram.Client {
		gotToken = token
		gotAPIURL = apiURL
		return telegram.NewClient(token, apiURL, httpClient)
	}

	var gotWebAppURL string
	newHandler = func(sender telegram.Sender, webAppURL string) *telegram.Handler {
		gotWebAppURL = webAppURL
		return telegram.NewHandler(sender, webAppURL)
	}

	polled := false
	pollUpdates = func(ctx context.Context, getter telegram.UpdateGetter, handler telegram.UpdateHandler, timeout int) error {
		polled = true
		if timeout != 30 {
			t.Fatalf("timeout = %d, want 30", timeout)
		}
		return nil
	}

	if err := run(context.Background()); err != nil {
		t.Fatalf("run returned error: %v", err)
	}
	if gotToken != "token" || gotAPIURL != telegramAPIURL {
		t.Fatalf("client args = (%q, %q)", gotToken, gotAPIURL)
	}
	if gotWebAppURL != "https://example.com/app" {
		t.Fatalf("handler web app URL = %q", gotWebAppURL)
	}
	if !polled {
		t.Fatalf("pollUpdates was not called")
	}
}
