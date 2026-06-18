package lineups

import "github.com/go-chi/chi/v5"

func RegisterRoutes(router chi.Router, handler Handler) {
	router.Get("/api/lineups/view_filters", ViewFilters)
	router.Get("/api/lineups/view_filters/", ViewFilters)
	router.Get("/api/lineups/view_sorts", ViewSorts)
	router.Get("/api/lineups/view_sorts/", ViewSorts)

	for _, base := range []string{"/api/lineups", "/api/lineups/"} {
		router.Get(base, handler.List)
		router.Post(base, handler.Create)
	}
	for _, path := range []string{"/api/lineups/{id}", "/api/lineups/{id}/"} {
		router.Get(path, handler.Detail)
		router.Put(path, handler.Replace)
		router.Patch(path, handler.Patch)
		router.Delete(path, handler.Delete)
	}
	for _, path := range []string{"/api/lineups/{id}/change-grenade-class", "/api/lineups/{id}/change-grenade-class/"} {
		router.Patch(path, handler.ChangeGrenadeClass)
	}
}
