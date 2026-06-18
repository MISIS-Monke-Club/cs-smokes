package httpserver

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/admin"
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
	AdminRoles     admin.RoleRepository
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
	admin.RegisterRoutes(router, admin.NewHandler(repos.AdminRoles, repos.Users, repos.PullRequests, adminActor(cfg.SecretKey)))
	registerAdminContentRoutes(router, cfg, repos)
	router.Get("/ws/api/pull_requests/{pr_id}/comments/", realtime.NewHandler(repos.Realtime, cfg.SecretKey, cfg.WSAllowDevAnon).Comments)

	return &http.Server{Addr: cfg.HTTPAddr, Handler: router}
}

func health(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func registerAdminContentRoutes(router chi.Router, cfg config.Config, repos Repositories) {
	gate := func(next http.HandlerFunc) http.HandlerFunc {
		return admin.RequireAdmin(repos.AdminRoles, adminActor(cfg.SecretKey), next)
	}
	mapHandler := maps.NewHandler(repos.Maps, cfg.MediaRoot)
	lineupHandler := lineups.NewHandler(repos.Lineups, cfg.MediaRoot)
	classHandler := grenadeclasses.NewHandler(repos.GrenadeClasses)
	propertyHandler := properties.NewHandler(repos.Properties)

	for _, base := range []string{"/api/admin/maps", "/api/admin/maps/"} {
		router.Get(base, gate(mapHandler.List))
		router.Post(base, gate(mapHandler.Create))
	}
	for _, path := range []string{"/api/admin/maps/{id}", "/api/admin/maps/{id}/"} {
		router.Get(path, gate(mapHandler.Detail))
		router.Put(path, gate(mapHandler.Replace))
		router.Patch(path, gate(mapHandler.Patch))
		router.Delete(path, gate(mapHandler.Delete))
	}
	for _, base := range []string{"/api/admin/lineups", "/api/admin/lineups/"} {
		router.Get(base, gate(lineupHandler.List))
		router.Post(base, gate(lineupHandler.Create))
	}
	for _, path := range []string{"/api/admin/lineups/{id}", "/api/admin/lineups/{id}/"} {
		router.Get(path, gate(lineupHandler.Detail))
		router.Put(path, gate(lineupHandler.Replace))
		router.Patch(path, gate(lineupHandler.Patch))
		router.Delete(path, gate(lineupHandler.Delete))
	}
	for _, path := range []string{"/api/admin/lineups/{id}/change-grenade-class", "/api/admin/lineups/{id}/change-grenade-class/"} {
		router.Patch(path, gate(lineupHandler.ChangeGrenadeClass))
	}
	for _, base := range []string{"/api/admin/grenade-classes", "/api/admin/grenade-classes/"} {
		router.Get(base, gate(classHandler.List))
		router.Post(base, gate(classHandler.Create))
	}
	for _, path := range []string{"/api/admin/grenade-classes/{id}", "/api/admin/grenade-classes/{id}/"} {
		router.Get(path, gate(classHandler.Detail))
		router.Put(path, gate(classHandler.Replace))
		router.Patch(path, gate(classHandler.Patch))
		router.Delete(path, gate(classHandler.Delete))
	}
	for _, base := range []string{"/api/admin/properties", "/api/admin/properties/"} {
		router.Get(base, gate(propertyHandler.List))
		router.Post(base, gate(propertyHandler.Create))
	}
	for _, path := range []string{"/api/admin/properties/{id}", "/api/admin/properties/{id}/"} {
		router.Get(path, gate(propertyHandler.Detail))
		router.Put(path, gate(propertyHandler.Replace))
		router.Patch(path, gate(propertyHandler.Patch))
		router.Delete(path, gate(propertyHandler.Delete))
	}
	router.Get("/api/admin/property-list", gate(propertyHandler.ListRelations))
	router.Get("/api/admin/property-list/", gate(propertyHandler.ListRelations))
	for _, path := range []string{"/api/admin/lineups/{grenade_id}/properties", "/api/admin/lineups/{grenade_id}/properties/"} {
		router.Post(path, gate(propertyHandler.CreateLineupProperty))
	}
	for _, path := range []string{"/api/admin/lineups/{grenade_id}/properties/{property_id}", "/api/admin/lineups/{grenade_id}/properties/{property_id}/"} {
		router.Delete(path, gate(propertyHandler.DeleteLineupProperty))
	}
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

func adminActor(secret string) admin.ActorFunc {
	return func(r *http.Request) (admin.Actor, bool) {
		claims, ok := bearerClaims(secret, r)
		if !ok {
			return admin.Actor{}, false
		}
		return admin.Actor{
			UserID: claims.UserID,
			Claims: auth.RoleSet{
				IsSuperuser: claims.IsSuperuser,
				IsBaseAdmin: claims.IsBaseAdmin,
				IsEditor:    claims.IsEditor,
			},
		}, true
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
