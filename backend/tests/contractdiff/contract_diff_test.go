package contractdiff_test

import (
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

func TestContractDiffFailsBeforeCallingNewBackendWhenLegacyUnavailable(t *testing.T) {
	corpus := writeCorpus(t, `
metadata:
  contract_corpus_version: go-backend-v1
cases:
  - name: example
    method: GET
    path: /api/example
`)
	newCalled := false
	newServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		newCalled = true
		w.WriteHeader(http.StatusOK)
	}))
	defer newServer.Close()

	cmd := exec.Command("go", "run", "../../tools/contract-diff", "--old-base", "http://127.0.0.1:1", "--new-base", newServer.URL, "--corpus", corpus)
	output, err := cmd.CombinedOutput()
	if err == nil {
		t.Fatalf("contract-diff unexpectedly passed: %s", output)
	}
	if !strings.Contains(string(output), "legacy baseline unavailable") {
		t.Fatalf("output = %s", output)
	}
	if newCalled {
		t.Fatalf("new backend was called before legacy baseline was proven reachable")
	}
}

func TestContractDiffReportsActionableResponseDifferences(t *testing.T) {
	corpus := writeCorpus(t, `
metadata:
  contract_corpus_version: go-backend-v1
cases:
  - name: example detail
    method: GET
    path: /api/example
`)
	oldServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if r.URL.Path == "/api/health" {
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(`{"status":"ok"}`))
			return
		}
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"OPEN","detail":null}`))
	}))
	defer oldServer.Close()
	newServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		_, _ = w.Write([]byte(`{"status":"CLOSED"}`))
	}))
	defer newServer.Close()

	cmd := exec.Command("go", "run", "../../tools/contract-diff", "--old-base", oldServer.URL, "--new-base", newServer.URL, "--corpus", corpus)
	output, err := cmd.CombinedOutput()
	if err == nil {
		t.Fatalf("contract-diff unexpectedly passed: %s", output)
	}
	text := string(output)
	for _, expected := range []string{"example detail", "status code", "json body"} {
		if !strings.Contains(text, expected) {
			t.Fatalf("output = %s, missing %q", text, expected)
		}
	}
}

func writeCorpus(t *testing.T, content string) string {
	t.Helper()
	path := filepath.Join(t.TempDir(), "corpus.yaml")
	if err := os.WriteFile(path, []byte(content), 0o600); err != nil {
		t.Fatalf("write corpus: %v", err)
	}
	return path
}
