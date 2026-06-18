package httpserver

import (
	"encoding/json"
	"net/http"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/auth"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/config"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/platform/httpx"
	"github.com/go-chi/chi/v5"
)

func New(cfg config.Config) *http.Server {
	router := chi.NewRouter()
	router.Use(httpx.CORS(cfg.AllowedOrigins))
	router.Use(httpx.WriteGate(cfg.WriteGate))
	router.Get("/healthz", health)
	router.Get("/api/healthz", health)
	router.Get("/api/healthz/", health)
	router.Get("/api/health", health)
	router.Get("/api/health/", health)
	auth.RegisterRoutes(router, auth.NewHandler(nil, cfg.SecretKey, cfg.TelegramToken))

	return &http.Server{Addr: cfg.HTTPAddr, Handler: router}
}

func health(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}
