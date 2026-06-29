package config

import (
	"errors"
	"os"
	"strings"
)

type Config struct {
	Token     string
	WebAppURL string
}

func Load() (Config, error) {
	cfg := Config{
		Token:     strings.TrimSpace(os.Getenv("TOKEN")),
		WebAppURL: strings.TrimSpace(os.Getenv("WEB_APP_URL")),
	}
	if cfg.Token == "" {
		return Config{}, errors.New("TOKEN is required")
	}
	if cfg.WebAppURL == "" {
		return Config{}, errors.New("WEB_APP_URL is required")
	}
	return cfg, nil
}
