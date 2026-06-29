package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/MISIS-Monke-Club/cs-smokes/bot/internal/config"
	"github.com/MISIS-Monke-Club/cs-smokes/bot/internal/telegram"
)

const telegramAPIURL = "https://api.telegram.org"

var (
	loadConfig  = config.Load
	newClient   = telegram.NewClient
	newHandler  = telegram.NewHandler
	pollUpdates = telegram.Poll
	run         = runBot
	fatalf      = log.Fatalf
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	if err := run(ctx); err != nil && !errors.Is(err, context.Canceled) {
		fatalf("poll telegram updates: %v", err)
	}
}

func runBot(ctx context.Context) error {
	cfg, err := loadConfig()
	if err != nil {
		return err
	}

	client := newClient(cfg.Token, telegramAPIURL, http.DefaultClient)
	handler := newHandler(client, cfg.WebAppURL)

	log.Println("Бот запущен!")
	return pollUpdates(ctx, client, handler, 30)
}
