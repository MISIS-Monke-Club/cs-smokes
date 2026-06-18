package users

import "github.com/go-chi/chi/v5"

func RegisterRoutes(router chi.Router, handler Handler) {
	for _, base := range []string{"/api/users", "/api/users/"} {
		router.Get(base, handler.List)
		router.Post(base, handler.Create)
	}
	for _, path := range []string{"/api/users/{id}", "/api/users/{id}/"} {
		router.Get(path, handler.Detail)
		router.Put(path, handler.Replace)
		router.Patch(path, handler.Patch)
		router.Delete(path, handler.Delete)
	}
}
