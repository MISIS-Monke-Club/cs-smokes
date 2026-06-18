package logscan_test

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

func TestLogscanFailsWithoutEchoingSentinel(t *testing.T) {
	dir := t.TempDir()
	sentinel := "raw.secret.token"
	write(t, filepath.Join(dir, "sentinels.txt"), sentinel+"\n")
	write(t, filepath.Join(dir, "backend.log"), "request token="+sentinel+"\n")

	cmd := exec.Command("go", "run", "../../tools/logscan", "--sentinel-file", filepath.Join(dir, "sentinels.txt"), "--logs", dir)
	output, err := cmd.CombinedOutput()
	if err == nil {
		t.Fatalf("logscan unexpectedly passed: %s", output)
	}
	text := string(output)
	if !strings.Contains(text, "backend.log") {
		t.Fatalf("output missing matching path: %s", text)
	}
	if strings.Contains(text, sentinel) {
		t.Fatalf("output leaked sentinel: %s", text)
	}
}

func TestLogscanPassesWhenSentinelsAreAbsent(t *testing.T) {
	dir := t.TempDir()
	write(t, filepath.Join(dir, "sentinels.txt"), "raw.secret.token\n")
	write(t, filepath.Join(dir, "backend.log"), "token=[REDACTED]\n")

	cmd := exec.Command("go", "run", "../../tools/logscan", "--sentinel-file", filepath.Join(dir, "sentinels.txt"), "--logs", dir)
	output, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("logscan failed: %v\n%s", err, output)
	}
}

func write(t *testing.T, path string, content string) {
	t.Helper()
	if err := os.WriteFile(path, []byte(content), 0o600); err != nil {
		t.Fatalf("write %s: %v", path, err)
	}
}
