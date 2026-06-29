package contract

import (
	"slices"
	"strings"
	"testing"
)

func TestCorpusLoads(t *testing.T) {
	corpus, err := LoadCorpus("corpus.yaml")
	if err != nil {
		t.Fatalf("LoadCorpus returned error: %v", err)
	}
	if len(corpus.Cases) < 80 {
		t.Fatalf("expected at least 80 contract cases, got %d", len(corpus.Cases))
	}
	if corpus.Metadata.ContractCorpusVersion != "go-backend-v1" {
		t.Fatalf("contract corpus version = %q", corpus.Metadata.ContractCorpusVersion)
	}
}

func TestCorpusCoversRequiredSlashVariantsAndMethods(t *testing.T) {
	corpus, err := LoadCorpus("corpus.yaml")
	if err != nil {
		t.Fatalf("LoadCorpus returned error: %v", err)
	}

	requiredPaths := []string{
		"/api/maps",
		"/api/maps/",
		"/api/lineups",
		"/api/lineups/",
		"/api/users",
		"/api/users/",
		"/api/grenade-classes",
		"/api/grenade-classes/",
		"/api/favorites/1",
		"/api/favorites/1/",
		"/api/pull_requests/1",
		"/api/pull_requests/1/",
		"/api/health",
		"/api/health/",
	}
	for _, path := range requiredPaths {
		if !corpus.HasPath(path) {
			t.Fatalf("corpus is missing required path %s", path)
		}
	}

	requiredMethods := map[string][]string{
		"/api/login/tg/":                      {"POST"},
		"/api/login/":                         {"POST"},
		"/api/register/":                      {"POST"},
		"/api/users":                          {"GET", "POST"},
		"/api/users/1":                        {"GET", "PUT", "PATCH", "DELETE"},
		"/api/maps":                           {"GET", "POST"},
		"/api/maps/1":                         {"GET", "PUT", "PATCH", "DELETE"},
		"/api/grenade-classes":                {"GET", "POST"},
		"/api/grenade-classes/1":              {"GET", "PUT", "PATCH", "DELETE"},
		"/api/lineups":                        {"GET", "POST"},
		"/api/lineups/1":                      {"GET", "PUT", "PATCH", "DELETE"},
		"/api/lineups/1/change-grenade-class": {"PATCH"},
		"/api/lineups/view_filters":           {"GET"},
		"/api/lineups/view_sorts":             {"GET"},
		"/api/properties":                     {"GET", "POST"},
		"/api/properties/1":                   {"GET", "PUT", "PATCH", "DELETE"},
		"/api/property-list":                  {"GET"},
		"/api/lineups/1/properties":           {"POST"},
		"/api/lineups/1/properties/1":         {"DELETE"},
		"/api/favorites":                      {"POST"},
		"/api/favorites/1":                    {"GET", "DELETE"},
		"/api/pull_requests":                  {"GET", "POST"},
		"/api/pull_requests/1":                {"GET", "PATCH", "DELETE", "PUT"},
		"/api/pull_requests/1/comments":       {"GET", "POST"},
		"/api/comments/1":                     {"GET", "PATCH", "DELETE", "PUT"},
		"/api/pull_requests/1/approve":        {"PATCH"},
		"/api/pull_requests/1/reject":         {"PATCH"},
		"/api/pull_requests/1/cancel":         {"PATCH"},
		"/api/health":                         {"GET"},
	}
	for path, methods := range requiredMethods {
		for _, method := range methods {
			if !corpus.HasCase(method, path) {
				t.Fatalf("corpus is missing %s %s", method, path)
			}
		}
	}

	if !slices.Contains(corpus.Tags(), "multipart") {
		t.Fatalf("corpus must include multipart write coverage")
	}
	if !slices.Contains(corpus.Tags(), "unsupported-method-405") {
		t.Fatalf("corpus must include unsupported method coverage")
	}
	if !slices.Contains(corpus.Tags(), "admin-denial") {
		t.Fatalf("corpus must include admin denial coverage")
	}
}

func TestCompareResponsesIgnoresVolatileValuesButKeepsShape(t *testing.T) {
	oldBody := []byte(`{"id":1,"access_token":"old","created_at":"2026-01-01T00:00:00Z","status":"OPEN","nested":{"updated_at":"old"}}`)
	newBody := []byte(`{"id":1,"access_token":"new","created_at":"2026-02-01T00:00:00Z","status":"OPEN","nested":{"updated_at":"new"}}`)

	diff := CompareResponses("token shape", ResponseSnapshot{
		StatusCode:  200,
		ContentType: "application/json",
		Body:        oldBody,
	}, ResponseSnapshot{
		StatusCode:  200,
		ContentType: "application/json; charset=utf-8",
		Body:        newBody,
	})

	if diff.HasDifferences() {
		t.Fatalf("expected volatile-only response changes to be ignored, got %s", diff.String())
	}
}

func TestCompareResponsesReportsStatusAndJSONShapeDiffs(t *testing.T) {
	diff := CompareResponses("status mismatch", ResponseSnapshot{
		StatusCode:  200,
		ContentType: "application/json",
		Body:        []byte(`{"status":"OPEN","detail":null}`),
	}, ResponseSnapshot{
		StatusCode:  404,
		ContentType: "application/json",
		Body:        []byte(`{"status":"CLOSED"}`),
	})

	text := diff.String()
	for _, expected := range []string{"status mismatch", "status code", "json body"} {
		if !strings.Contains(text, expected) {
			t.Fatalf("diff %q does not contain %q", text, expected)
		}
	}
}
