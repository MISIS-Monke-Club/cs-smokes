package openapi

import (
	"encoding/json"
	"net/http"
)

func Schema(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"openapi": "3.0.3",
		"info": map[string]string{
			"title":   "CS Smokes Go API",
			"version": "1.0.0",
		},
		"paths": map[string]any{
			"/api/health":                          method("get", "Health check"),
			"/api/login/":                          method("post", "Password login"),
			"/api/login/tg/":                       method("post", "Telegram WebApp login"),
			"/api/register/":                       method("post", "Register user"),
			"/api/maps":                            methods("get", "post"),
			"/api/maps/{id}":                       methods("get", "put", "patch", "delete"),
			"/api/lineups":                         methods("get", "post"),
			"/api/lineups/{id}":                    methods("get", "put", "patch", "delete"),
			"/api/pull_requests":                   methods("get", "post"),
			"/api/pull_requests/{id}":              methods("get", "patch", "delete"),
			"/api/admin/me":                        method("get", "Current admin role view"),
			"/api/admin/pull_requests":             method("get", "Admin moderation queue"),
			"/api/admin/maps":                      methods("get", "post"),
			"/api/admin/lineups":                   methods("get", "post"),
			"/api/admin/users":                     method("get", "Admin users"),
			"/ws/api/pull_requests/{id}/comments/": method("get", "WebSocket comments"),
		},
	})
}

func Docs(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = w.Write([]byte(`<!doctype html><html><head><title>CS Smokes API Docs</title></head><body><redoc spec-url="/api/schema"></redoc><script src="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js"></script></body></html>`))
}

func method(verb string, summary string) map[string]any {
	return map[string]any{verb: map[string]any{"summary": summary, "responses": map[string]any{"200": map[string]string{"description": "OK"}}}}
}

func methods(verbs ...string) map[string]any {
	out := map[string]any{}
	for _, verb := range verbs {
		out[verb] = map[string]any{"responses": map[string]any{"200": map[string]string{"description": "OK"}}}
	}
	return out
}
