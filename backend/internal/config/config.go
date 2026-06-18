package config

import (
	"errors"
	"fmt"
	"os"
	"strings"
)

type Config struct {
	HTTPAddr       string
	BackendBaseURL string
	AllowedOrigins []string
	DatabaseURL    string
	RedisAddr      string
	RedisPassword  string
	SecretKey      string
	TelegramToken  string
	MediaRoot      string
	PublicMediaURL string
	WriteGate      bool
	WSAllowDevAnon bool
}

func Load() (Config, error) {
	dbName := getenv("DB_NAME", "")
	dbUser := getenv("DB_USER", "")
	dbPass := getenv("DB_PASSWORD", "")
	dbHost := getenv("DB_HOST", "db")
	dbPort := getenv("DB_PORT", "5432")
	secret := getenv("SECRET_KEY", "")
	if dbName == "" || dbUser == "" || secret == "" {
		return Config{}, errors.New("DB_NAME, DB_USER, and SECRET_KEY are required")
	}

	cfg := Config{
		HTTPAddr:       getenv("HTTP_ADDR", ":8000"),
		BackendBaseURL: getenv("BACKEND_SERVER", "http://localhost:3000/api"),
		AllowedOrigins: splitCSV(
			getenv("ALLOWED_ORIGINS", "http://localhost:8000,http://localhost:3000"),
		),
		DatabaseURL: fmt.Sprintf(
			"postgres://%s:%s@%s:%s/%s?sslmode=disable",
			dbUser,
			dbPass,
			dbHost,
			dbPort,
			dbName,
		),
		RedisAddr:      getenv("REDIS_ADDR", "redis:6379"),
		RedisPassword:  getenv("REDIS_PASS", ""),
		SecretKey:      secret,
		TelegramToken:  getenv("TOKEN", ""),
		MediaRoot:      getenv("MEDIA_ROOT", "/backend/media"),
		PublicMediaURL: getenv("PUBLIC_MEDIA_URL", "/media/"),
		WriteGate:      getenv("WRITE_GATE", "false") == "true",
		WSAllowDevAnon: getenv("WS_ALLOW_UNAUTHENTICATED_DEV", "false") == "true",
	}
	return cfg, nil
}

func getenv(key string, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func splitCSV(value string) []string {
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}
