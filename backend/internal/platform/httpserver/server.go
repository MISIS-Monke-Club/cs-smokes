package httpserver

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/auth"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/config"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/favorites"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/grenadeclasses"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/lineups"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/maps"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/platform/httpx"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/properties"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/pullrequests"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/realtime"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/users"
	"github.com/go-chi/chi/v5"
)

type Repositories struct {
	Auth           auth.UserRepository
	Users          users.Repository
	GrenadeClasses grenadeclasses.Repository
	Maps           maps.Repository
	Lineups        lineups.Repository
	Properties     properties.Repository
	Favorites      favorites.Repository
	PullRequests   pullrequests.Repository
	Realtime       realtime.Repository
}

func New(cfg config.Config) *http.Server {
	return NewWithRepositories(cfg, Repositories{})
}

func NewWithRepositories(cfg config.Config, repos Repositories) *http.Server {
	router := chi.NewRouter()
	router.Use(httpx.CORS(cfg.AllowedOrigins))
	router.Use(httpx.WriteGate(cfg.WriteGate))
	router.Get("/healthz", health)
	router.Get("/api/healthz", health)
	router.Get("/api/healthz/", health)
	router.Get("/api/health", health)
	router.Get("/api/health/", health)
	auth.RegisterRoutes(router, auth.NewHandler(repos.Auth, cfg.SecretKey, cfg.TelegramToken))
	users.RegisterRoutes(router, users.NewHandler(repos.Users))
	grenadeclasses.RegisterRoutes(router, grenadeclasses.NewHandler(repos.GrenadeClasses))
	maps.RegisterRoutes(router, maps.NewHandler(repos.Maps, cfg.MediaRoot))
	lineups.RegisterRoutes(router, lineups.NewHandler(repos.Lineups, cfg.MediaRoot))
	properties.RegisterRoutes(router, properties.NewHandler(repos.Properties))
	favorites.RegisterRoutes(router, favorites.NewHandler(repos.Favorites, currentUser(cfg.SecretKey)))
	pullrequests.RegisterRoutes(router, pullrequests.NewHandler(repos.PullRequests, actor(cfg.SecretKey)))
	router.Get("/ws/api/pull_requests/{pr_id}/comments/", realtime.NewHandler(repos.Realtime, cfg.SecretKey, cfg.WSAllowDevAnon).Comments)

	return &http.Server{Addr: cfg.HTTPAddr, Handler: router}
}

func health(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func currentUser(secret string) favorites.CurrentUserFunc {
	return func(r *http.Request) int {
		claims, ok := bearerClaims(secret, r)
		if !ok {
			return 0
		}
		return claims.UserID
	}
}

func actor(secret string) pullrequests.ActorFunc {
	return func(r *http.Request) pullrequests.Actor {
		claims, ok := bearerClaims(secret, r)
		if !ok {
			return pullrequests.Actor{}
		}
		return pullrequests.Actor{
			UserID:      claims.UserID,
			IsSuperuser: claims.IsSuperuser,
			IsBaseAdmin: claims.IsBaseAdmin,
			IsEditor:    claims.IsEditor,
		}
	}
}

func bearerClaims(secret string, r *http.Request) (auth.UserClaims, bool) {
	raw := r.Header.Get("Authorization")
	token, ok := strings.CutPrefix(raw, "Bearer ")
	if !ok || token == "" {
		return auth.UserClaims{}, false
	}
	claims, err := auth.ParseAccessToken(secret, token)
	if err != nil {
		return auth.UserClaims{}, false
	}
	return claims, true
}
