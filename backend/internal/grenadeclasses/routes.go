package grenadeclasses

import "github.com/go-chi/chi/v5"

func RegisterRoutes(router chi.Router, handler Handler) {
	for _, base := range []string{"/api/grenade-classes", "/api/grenade-classes/"} {
		router.Get(base, handler.List)
		router.Post(base, handler.Create)
	}
	for _, path := range []string{"/api/grenade-classes/{id}", "/api/grenade-classes/{id}/"} {
		router.Get(path, handler.Detail)
		router.Put(path, handler.Replace)
		router.Patch(path, handler.Patch)
		router.Delete(path, handler.Delete)
	}
}
