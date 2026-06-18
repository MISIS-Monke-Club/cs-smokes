package properties

import "github.com/go-chi/chi/v5"

func RegisterRoutes(router chi.Router, handler Handler) {
	for _, base := range []string{"/api/properties", "/api/properties/"} {
		router.Get(base, handler.List)
		router.Post(base, handler.Create)
	}
	for _, path := range []string{"/api/properties/{id}", "/api/properties/{id}/"} {
		router.Get(path, handler.Detail)
		router.Put(path, handler.Replace)
		router.Patch(path, handler.Patch)
		router.Delete(path, handler.Delete)
	}
	router.Get("/api/property-list", handler.ListRelations)
	router.Get("/api/property-list/", handler.ListRelations)
	for _, path := range []string{"/api/lineups/{grenade_id}/properties", "/api/lineups/{grenade_id}/properties/"} {
		router.Post(path, handler.CreateLineupProperty)
	}
	for _, path := range []string{"/api/lineups/{grenade_id}/properties/{property_id}", "/api/lineups/{grenade_id}/properties/{property_id}/"} {
		router.Delete(path, handler.DeleteLineupProperty)
	}
}
