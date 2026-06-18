package httpserver

import (
	"encoding/json"
	"net/http"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/config"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/platform/httpx"
	"github.com/go-chi/chi/v5"
)

func New(cfg config.Config) *http.Server {
	router := chi.NewRouter()
	router.Use(httpx.CORS(cfg.AllowedOrigins))
	router.Get("/healthz", health)
	router.Get("/api/healthz", health)
	router.Get("/api/healthz/", health)
	router.Get("/api/health", health)
	router.Get("/api/health/", health)

	return &http.Server{Addr: cfg.HTTPAddr, Handler: router}
}

func health(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}
