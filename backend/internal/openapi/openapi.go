package openapi

import (
	"encoding/json"
	"net/http"
)

func Schema(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(document())
}

func Docs(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = w.Write([]byte(`<!doctype html><html><head><title>CS Smokes API Docs</title></head><body><redoc spec-url="/api/schema"></redoc><script src="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js"></script></body></html>`))
}

func document() map[string]any {
	return map[string]any{
		"openapi": "3.0.3",
		"info": map[string]string{
			"title":   "CS Smokes API",
			"version": "1.0.0",
		},
		"servers": []map[string]string{{"url": "/"}},
		"tags": []map[string]string{
			{"name": "auth"},
			{"name": "users"},
			{"name": "catalog"},
			{"name": "lineups"},
			{"name": "pull_requests"},
			{"name": "admin"},
			{"name": "realtime"},
		},
		"paths":      paths(),
		"components": components(),
	}
}

func paths() map[string]any {
	return map[string]any{
		"/api/health":    path(get("Health check", "catalog", "", ref("Health"))),
		"/api/healthz":   path(get("Health check", "catalog", "", ref("Health"))),
		"/api/login":     path(postJSON("Password login", "auth", ref("LoginInput"), ref("LoginResponse"), false)),
		"/api/login/":    path(postJSON("Password login", "auth", ref("LoginInput"), ref("LoginResponse"), false)),
		"/api/login/tg":  path(postJSON("Telegram WebApp login", "auth", ref("TelegramLoginInput"), ref("LoginResponse"), false)),
		"/api/login/tg/": path(postJSON("Telegram WebApp login", "auth", ref("TelegramLoginInput"), ref("LoginResponse"), false)),
		"/api/register":  path(postJSON("Register user", "auth", ref("RegisterInput"), ref("LoginResponse"), false)),
		"/api/register/": path(postJSON("Register user", "auth", ref("RegisterInput"), ref("LoginResponse"), false)),

		"/api/users":      crudCollection("users", refArray("User"), ref("UserInput"), true),
		"/api/users/":     crudCollection("users", refArray("User"), ref("UserInput"), true),
		"/api/users/{id}": crudResource("users", ref("User"), ref("UserInput"), ref("UserPatchInput"), true),

		"/api/grenade-classes":      crudCollection("catalog", refArray("GrenadeClass"), ref("GrenadeClassInput"), true),
		"/api/grenade-classes/":     crudCollection("catalog", refArray("GrenadeClass"), ref("GrenadeClassInput"), true),
		"/api/grenade-classes/{id}": crudResource("catalog", ref("GrenadeClass"), ref("GrenadeClassInput"), ref("GrenadeClassPatchInput"), true),

		"/api/maps":      multipartCollection("catalog", refArray("Map"), ref("MapInput")),
		"/api/maps/":     multipartCollection("catalog", refArray("Map"), ref("MapInput")),
		"/api/maps/{id}": multipartResource("catalog", ref("MapDetail"), ref("MapInput"), ref("MapPatchInput")),

		"/api/lineups":                           multipartCollection("lineups", refArray("Lineup"), ref("LineupInput")),
		"/api/lineups/":                          multipartCollection("lineups", refArray("Lineup"), ref("LineupInput")),
		"/api/lineups/{id}":                      multipartResource("lineups", ref("Lineup"), ref("LineupInput"), ref("LineupPatchInput")),
		"/api/lineups/{id}/change-grenade-class": path(patchJSON("Change lineup grenade class", "lineups", ref("ChangeGrenadeClassInput"), ref("Lineup"), true)),
		"/api/lineups/view_filters":              path(get("Lineup filter metadata", "lineups", "", object())),
		"/api/lineups/view_sorts":                path(get("Lineup sort metadata", "lineups", "", object())),
		"/api/lineups/{grenade_id}/properties":   path(postJSON("Attach property to lineup", "catalog", nil, ref("PropertyRelation"), true)),
		"/api/lineups/{grenade_id}/properties/{property_id}": path(map[string]any{
			"delete": operation("Delete lineup property", "catalog", nil, nil, noContent(), true),
		}),

		"/api/properties":      crudCollection("catalog", refArray("Property"), ref("PropertyInput"), true),
		"/api/properties/":     crudCollection("catalog", refArray("Property"), ref("PropertyInput"), true),
		"/api/properties/{id}": crudResource("catalog", ref("Property"), ref("PropertyInput"), ref("PropertyInput"), true),
		"/api/property-list":   path(get("List lineup property relations", "catalog", "", refArray("PropertyRelation"))),
		"/api/property-list/":  path(get("List lineup property relations", "catalog", "", refArray("PropertyRelation"))),

		"/api/favorites":      path(postJSON("Create favorite", "lineups", ref("FavoriteInput"), ref("Favorite"), true)),
		"/api/favorites/":     path(postJSON("Create favorite", "lineups", ref("FavoriteInput"), ref("Favorite"), true)),
		"/api/favorites/{id}": path(get("List favorites by user", "lineups", "", refArray("Lineup")), map[string]any{"delete": operation("Delete favorite by lineup id", "lineups", nil, nil, noContent(), true)}),

		"/api/pull_requests":               path(get("List pull requests", "pull_requests", "", refArray("PullRequest")), postJSON("Create pull request", "pull_requests", ref("PullRequestInput"), ref("PullRequestCreate"), true)),
		"/api/pull_requests/":              path(get("List pull requests", "pull_requests", "", refArray("PullRequest")), postJSON("Create pull request", "pull_requests", ref("PullRequestInput"), ref("PullRequestCreate"), true)),
		"/api/pull_requests/{id}":          path(get("Get pull request", "pull_requests", "", ref("PullRequest")), patchJSON("Update pull request status", "pull_requests", ref("PullRequestPatchInput"), ref("PullRequest"), true), map[string]any{"delete": operation("Delete pull request", "pull_requests", nil, nil, noContent(), true)}),
		"/api/pull_requests/{id}/approve":  path(patchJSON("Approve pull request", "pull_requests", nil, ref("PullRequest"), true)),
		"/api/pull_requests/{id}/reject":   path(patchJSON("Reject pull request", "pull_requests", nil, ref("PullRequest"), true)),
		"/api/pull_requests/{id}/cancel":   path(patchJSON("Cancel pull request", "pull_requests", nil, ref("PullRequest"), true)),
		"/api/pull_requests/{id}/comments": path(get("List pull request comments", "pull_requests", "", refArray("Comment")), postJSON("Create pull request comment", "pull_requests", ref("CommentInput"), ref("Comment"), true)),
		"/api/comments/{id}":               path(get("Get comment", "pull_requests", "", ref("Comment")), patchJSON("Update comment", "pull_requests", ref("CommentInput"), ref("Comment"), true), map[string]any{"delete": operation("Delete comment", "pull_requests", nil, nil, noContent(), true)}),
		"/ws/api/pull_requests/{pr_id}/comments/": path(map[string]any{
			"get": operation("Realtime pull request comments websocket", "realtime", nil, nil, response("101", "Switching Protocols", nil), false),
		}),

		"/api/admin/me":    path(get("Current admin role view", "admin", "", ref("AdminMe"), true)),
		"/api/admin/users": path(get("List admin users", "admin", "", refArray("AdminUser"), true)),
		"/api/admin/users/{id}/roles": path(map[string]any{
			"put": operation("Set admin user roles", "admin", jsonBody(ref("AdminRolesInput")), nil, noContent(), true),
		}),
		"/api/admin/maps":                            multipartCollection("admin", refArray("Map"), ref("MapInput"), true),
		"/api/admin/maps/{id}":                       multipartResource("admin", ref("MapDetail"), ref("MapInput"), ref("MapPatchInput"), true),
		"/api/admin/lineups":                         multipartCollection("admin", refArray("Lineup"), ref("LineupInput"), true),
		"/api/admin/lineups/{id}":                    multipartResource("admin", ref("Lineup"), ref("LineupInput"), ref("LineupPatchInput"), true),
		"/api/admin/grenade-classes":                 crudCollection("admin", refArray("GrenadeClass"), ref("GrenadeClassInput"), true),
		"/api/admin/grenade-classes/{id}":            crudResource("admin", ref("GrenadeClass"), ref("GrenadeClassInput"), ref("GrenadeClassPatchInput"), true),
		"/api/admin/properties":                      crudCollection("admin", refArray("Property"), ref("PropertyInput"), true),
		"/api/admin/properties/{id}":                 crudResource("admin", ref("Property"), ref("PropertyInput"), ref("PropertyInput"), true),
		"/api/admin/property-list":                   path(get("List admin lineup property relations", "admin", "", refArray("PropertyRelation"), true)),
		"/api/admin/lineups/{grenade_id}/properties": path(postJSON("Attach admin property to lineup", "admin", nil, ref("PropertyRelation"), true)),
		"/api/admin/lineups/{grenade_id}/properties/{property_id}": path(map[string]any{
			"delete": operation("Delete admin lineup property", "admin", nil, nil, noContent(), true),
		}),
	}
}

func components() map[string]any {
	return map[string]any{
		"securitySchemes": map[string]any{
			"BearerAuth": map[string]any{"type": "http", "scheme": "bearer", "bearerFormat": "JWT"},
		},
		"schemas": schemas(),
	}
}

func schemas() map[string]any {
	return map[string]any{
		"Health":                 objectProps(map[string]any{"status": stringSchema()}),
		"LoginInput":             requiredObject([]string{"username", "password"}, map[string]any{"username": stringSchema(), "password": stringSchema()}),
		"TelegramLoginInput":     requiredObject([]string{"init_data"}, map[string]any{"init_data": stringSchema()}),
		"RegisterInput":          requiredObject([]string{"username", "email", "password"}, map[string]any{"username": stringSchema(), "email": stringSchema(), "password": stringSchema(), "first_name": nullableString(), "last_name": nullableString()}),
		"LoginResponse":          objectProps(map[string]any{"access_token": stringSchema(), "refresh_token": stringSchema(), "user": ref("Profile")}),
		"Profile":                objectProps(map[string]any{"user_id": integer(), "username": stringSchema(), "avatar_url": nullableString(), "first_name": nullableString(), "last_name": nullableString()}),
		"User":                   objectProps(map[string]any{"user_id": integer(), "username": stringSchema(), "email": nullableString(), "first_name": nullableString(), "last_name": nullableString(), "avatar_url": nullableString(), "steam_link": nullableString(), "tg_id": nullableInteger(), "is_banned": boolean()}),
		"UserInput":              objectProps(map[string]any{"username": stringSchema(), "email": nullableString(), "password": stringSchema(), "first_name": nullableString(), "last_name": nullableString(), "avatar_url": nullableString(), "steam_link": nullableString()}),
		"UserPatchInput":         objectProps(map[string]any{"username": stringSchema(), "email": nullableString(), "password": stringSchema(), "first_name": nullableString(), "last_name": nullableString(), "avatar_url": nullableString(), "steam_link": nullableString()}),
		"AdminMe":                objectProps(map[string]any{"user_id": integer(), "roles": array(enum("superuser", "base_admin", "editor"))}),
		"AdminUser":              objectProps(map[string]any{"user_id": integer(), "username": stringSchema(), "email": nullableString(), "first_name": nullableString(), "last_name": nullableString(), "is_banned": boolean(), "roles": array(enum("superuser", "base_admin", "editor"))}),
		"AdminRolesInput":        requiredObject([]string{"roles"}, map[string]any{"roles": array(enum("superuser", "base_admin", "editor"))}),
		"GrenadeClass":           objectProps(map[string]any{"grenade_class_id": integer(), "name": stringSchema(), "description": nullableString(), "price": integer()}),
		"GrenadeClassInput":      requiredObject([]string{"name"}, map[string]any{"name": stringSchema(), "description": nullableString(), "price": integer()}),
		"GrenadeClassPatchInput": objectProps(map[string]any{"name": stringSchema(), "description": nullableString(), "price": integer()}),
		"Map":                    objectProps(map[string]any{"map_id": integer(), "name": stringSchema(), "link": nullableString(), "is_esports_pool": boolean(), "image_link": nullableString()}),
		"MapDetail":              objectProps(map[string]any{"map_id": integer(), "name": stringSchema(), "link": nullableString(), "is_esports_pool": boolean(), "image_link": nullableString(), "map_lineups": array(object())}),
		"MapInput":               objectProps(map[string]any{"name": stringSchema(), "link": nullableString(), "is_esports_pool": boolean(), "image_link": file()}),
		"MapPatchInput":          objectProps(map[string]any{"name": stringSchema(), "link": nullableString(), "is_esports_pool": boolean(), "image_link": file()}),
		"Property":               objectProps(map[string]any{"property_id": integer(), "name": stringSchema(), "value": nullableString()}),
		"PropertyInput":          objectProps(map[string]any{"name": stringSchema(), "value": nullableString()}),
		"PropertyRelation":       objectProps(map[string]any{"property_id": integer(), "grenade_id": integer(), "name": stringSchema(), "value": nullableString()}),
		"LineupProperty":         objectProps(map[string]any{"property_id": integer(), "name": stringSchema(), "value": nullableString()}),
		"RequestStatus":          objectProps(map[string]any{"request_id": nullableInteger(), "status": stringSchema()}),
		"Lineup": objectProps(map[string]any{
			"user_id": integer(), "grenade_id": integer(), "map_id": integer(), "link_to_video": nullableString(), "creator": ref("Profile"),
			"created_at": stringFormat("date-time"), "title": stringSchema(), "description": nullableString(), "is_approved": boolean(), "is_favorite": boolean(),
			"views": integer(), "preview_image_link": nullableString(), "grenade_class": ref("GrenadeClass"), "property_list": array(ref("LineupProperty")), "request": ref("RequestStatus"),
		}),
		"LineupInput":             objectProps(map[string]any{"map_id": integer(), "user_id": integer(), "grenade_class_id": integer(), "link_to_video": nullableString(), "title": stringSchema(), "description": nullableString(), "is_approved": boolean(), "views": integer(), "preview_image_link": file()}),
		"LineupPatchInput":        objectProps(map[string]any{"map_id": integer(), "user_id": integer(), "grenade_class_id": integer(), "link_to_video": nullableString(), "title": stringSchema(), "description": nullableString(), "is_approved": boolean(), "views": integer(), "preview_image_link": file()}),
		"ChangeGrenadeClassInput": objectProps(map[string]any{"grenade_class_id": integer()}),
		"FavoriteInput":           requiredObject([]string{"grenade_id"}, map[string]any{"grenade_id": integer()}),
		"Favorite":                objectProps(map[string]any{"user_id": integer(), "grenade_id": integer()}),
		"PullRequestStatus":       enum("OPEN", "APPROVED", "REJECTED", "MERGED", "CLOSED"),
		"PullRequest":             objectProps(map[string]any{"id": integer(), "lineup": ref("Lineup"), "creator": ref("UserSummary"), "approver": nullableRef("UserSummary"), "status": ref("PullRequestStatus"), "created_at": stringFormat("date-time"), "closed_at": nullableString()}),
		"PullRequestCreate":       objectProps(map[string]any{"id": integer(), "lineup_id": integer(), "status": ref("PullRequestStatus")}),
		"PullRequestInput":        requiredObject([]string{"lineup_id"}, map[string]any{"lineup_id": integer()}),
		"PullRequestPatchInput":   objectProps(map[string]any{"status": ref("PullRequestStatus")}),
		"UserSummary":             objectProps(map[string]any{"id": integer(), "username": stringSchema(), "first_name": nullableString(), "last_name": nullableString(), "avatar_url": nullableString()}),
		"CommentCreator":          objectProps(map[string]any{"user_id": integer(), "username": stringSchema(), "avatar_url": nullableString(), "first_name": nullableString(), "last_name": nullableString(), "role": stringSchema()}),
		"Comment":                 objectProps(map[string]any{"id": integer(), "text": stringSchema(), "creator": ref("CommentCreator"), "created_at": stringFormat("date-time")}),
		"CommentInput":            requiredObject([]string{"text"}, map[string]any{"text": stringSchema()}),
		"Error":                   objectProps(map[string]any{"error": object()}),
	}
}

func crudCollection(tag string, listSchema map[string]any, inputSchema map[string]any, secured bool) map[string]any {
	return path(get("List "+tag, tag, "", listSchema), postJSON("Create "+tag, tag, inputSchema, itemSchema(listSchema), secured))
}

func crudResource(tag string, responseSchema map[string]any, inputSchema map[string]any, patchSchema map[string]any, secured bool) map[string]any {
	return path(
		get("Get "+tag, tag, "", responseSchema),
		putJSON("Replace "+tag, tag, inputSchema, responseSchema, secured),
		patchJSON("Patch "+tag, tag, patchSchema, responseSchema, secured),
		map[string]any{"delete": operation("Delete "+tag, tag, nil, nil, noContent(), secured)},
	)
}

func multipartCollection(tag string, listSchema map[string]any, inputSchema map[string]any, secured ...bool) map[string]any {
	requiresAuth := len(secured) > 0 && secured[0]
	return path(get("List "+tag, tag, "", listSchema, requiresAuth), map[string]any{
		"post": operation("Create "+tag, tag, multipartBody(inputSchema), nil, jsonResponse(itemSchema(listSchema)), requiresAuth),
	})
}

func multipartResource(tag string, responseSchema map[string]any, inputSchema map[string]any, patchSchema map[string]any, secured ...bool) map[string]any {
	requiresAuth := len(secured) > 0 && secured[0]
	return path(
		get("Get "+tag, tag, "", responseSchema, requiresAuth),
		operation("Replace "+tag, tag, multipartBody(inputSchema), nil, jsonResponse(responseSchema), requiresAuth, "put"),
		operation("Patch "+tag, tag, multipartBody(patchSchema), nil, jsonResponse(responseSchema), requiresAuth, "patch"),
		map[string]any{"delete": operation("Delete "+tag, tag, nil, nil, noContent(), requiresAuth)},
	)
}

func path(operations ...map[string]any) map[string]any {
	out := map[string]any{}
	for _, operation := range operations {
		for method, spec := range operation {
			out[method] = spec
		}
	}
	return out
}

func get(summary string, tag string, _ string, schema map[string]any, secured ...bool) map[string]any {
	requiresAuth := len(secured) > 0 && secured[0]
	return map[string]any{"get": operation(summary, tag, nil, nil, jsonResponse(schema), requiresAuth)}
}

func postJSON(summary string, tag string, requestSchema map[string]any, responseSchema map[string]any, secured bool) map[string]any {
	return map[string]any{"post": operation(summary, tag, jsonBody(requestSchema), nil, jsonResponse(responseSchema), secured)}
}

func putJSON(summary string, tag string, requestSchema map[string]any, responseSchema map[string]any, secured bool) map[string]any {
	return map[string]any{"put": operation(summary, tag, jsonBody(requestSchema), nil, jsonResponse(responseSchema), secured)}
}

func patchJSON(summary string, tag string, requestSchema map[string]any, responseSchema map[string]any, secured bool) map[string]any {
	return map[string]any{"patch": operation(summary, tag, jsonBody(requestSchema), nil, jsonResponse(responseSchema), secured)}
}

func operation(summary string, tag string, requestBody map[string]any, parameters []map[string]any, responses map[string]any, secured bool, methodOverride ...string) map[string]any {
	op := map[string]any{"summary": summary, "tags": []string{tag}, "responses": responses}
	if requestBody != nil {
		op["requestBody"] = requestBody
	}
	if parameters != nil {
		op["parameters"] = parameters
	}
	if secured {
		op["security"] = []map[string][]string{{"BearerAuth": {}}}
	}
	if len(methodOverride) > 0 {
		return map[string]any{methodOverride[0]: op}
	}
	return op
}

func jsonBody(schema map[string]any) map[string]any {
	if schema == nil {
		return nil
	}
	return map[string]any{"required": true, "content": map[string]any{"application/json": map[string]any{"schema": schema}}}
}

func multipartBody(schema map[string]any) map[string]any {
	return map[string]any{"required": true, "content": map[string]any{"multipart/form-data": map[string]any{"schema": schema}}}
}

func jsonResponse(schema map[string]any) map[string]any {
	return response("200", "OK", schema)
}

func noContent() map[string]any {
	return response("204", "No Content", nil)
}

func response(code string, description string, schema map[string]any) map[string]any {
	spec := map[string]any{"description": description}
	if schema != nil {
		spec["content"] = map[string]any{"application/json": map[string]any{"schema": schema}}
	}
	return map[string]any{code: spec}
}

func ref(name string) map[string]any {
	return map[string]any{"$ref": "#/components/schemas/" + name}
}

func nullableRef(name string) map[string]any {
	return map[string]any{"allOf": []map[string]any{ref(name)}, "nullable": true}
}

func refArray(name string) map[string]any {
	return array(ref(name))
}

func itemSchema(schema map[string]any) map[string]any {
	if items, ok := schema["items"].(map[string]any); ok {
		return items
	}
	return schema
}

func requiredObject(required []string, properties map[string]any) map[string]any {
	schema := objectProps(properties)
	schema["required"] = required
	return schema
}

func objectProps(properties map[string]any) map[string]any {
	return map[string]any{"type": "object", "properties": properties}
}

func object() map[string]any {
	return map[string]any{"type": "object"}
}

func array(item map[string]any) map[string]any {
	return map[string]any{"type": "array", "items": item}
}

func stringSchema() map[string]any {
	return map[string]any{"type": "string"}
}

func stringFormat(format string) map[string]any {
	return map[string]any{"type": "string", "format": format}
}

func nullableString() map[string]any {
	return map[string]any{"type": "string", "nullable": true}
}

func integer() map[string]any {
	return map[string]any{"type": "integer"}
}

func nullableInteger() map[string]any {
	return map[string]any{"type": "integer", "nullable": true}
}

func boolean() map[string]any {
	return map[string]any{"type": "boolean"}
}

func file() map[string]any {
	return map[string]any{"type": "string", "format": "binary"}
}

func enum(values ...string) map[string]any {
	items := make([]string, len(values))
	copy(items, values)
	return map[string]any{"type": "string", "enum": items}
}
