package favorites

import "github.com/go-chi/chi/v5"

func RegisterRoutes(router chi.Router, handler Handler) {
	router.Post("/api/favorites", handler.Create)
	router.Post("/api/favorites/", handler.Create)
	for _, path := range []string{"/api/favorites/{id}", "/api/favorites/{id}/"} {
		router.Get(path, handler.ListByUser)
		router.Delete(path, handler.Delete)
	}
}
