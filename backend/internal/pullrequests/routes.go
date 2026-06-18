package pullrequests

import "github.com/go-chi/chi/v5"

func RegisterRoutes(router chi.Router, handler Handler) {
	for _, base := range []string{"/api/pull_requests", "/api/pull_requests/"} {
		router.Get(base, handler.List)
		router.Post(base, handler.Create)
	}
	for _, path := range []string{"/api/pull_requests/{id}", "/api/pull_requests/{id}/"} {
		router.Get(path, handler.Detail)
		router.Patch(path, handler.Patch)
		router.Delete(path, handler.Delete)
	}
	for _, path := range []string{"/api/pull_requests/{id}/approve", "/api/pull_requests/{id}/approve/"} {
		router.Patch(path, handler.Approve)
	}
	for _, path := range []string{"/api/pull_requests/{id}/reject", "/api/pull_requests/{id}/reject/"} {
		router.Patch(path, handler.Reject)
	}
	for _, path := range []string{"/api/pull_requests/{id}/cancel", "/api/pull_requests/{id}/cancel/"} {
		router.Patch(path, handler.Cancel)
	}
	for _, path := range []string{"/api/pull_requests/{id}/comments", "/api/pull_requests/{id}/comments/"} {
		router.Get(path, handler.ListComments)
		router.Post(path, handler.CreateComment)
	}
	for _, path := range []string{"/api/comments/{id}", "/api/comments/{id}/"} {
		router.Get(path, handler.CommentDetail)
		router.Patch(path, handler.PatchComment)
		router.Delete(path, handler.DeleteComment)
	}
}
