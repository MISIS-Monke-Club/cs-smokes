package migratedjango_test

import (
	"os/exec"
	"strings"
	"testing"
)

func TestDryRunCommandPrintsReportSections(t *testing.T) {
	cmd := exec.Command(
		"go",
		"run",
		"../../tools/migrate-django",
		"--source-media",
		t.TempDir(),
		"--target-media",
		t.TempDir(),
		"--dry-run",
	)
	output, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("dry-run failed: %v\n%s", err, output)
	}
	text := string(output)
	for _, expected := range []string{
		"row counts",
		"id preservation report",
		"orphan report",
		"media report",
		"auth sample report",
		"sequence report",
	} {
		if !strings.Contains(text, expected) {
			t.Fatalf("output missing %q:\n%s", expected, text)
		}
	}
}

func TestLoadCommandRequiresSourceAndTarget(t *testing.T) {
	cmd := exec.Command(
		"go",
		"run",
		"../../tools/migrate-django",
		"--source-media",
		t.TempDir(),
		"--target-media",
		t.TempDir(),
	)
	output, err := cmd.CombinedOutput()
	if err == nil {
		t.Fatalf("load without DSNs unexpectedly passed:\n%s", output)
	}
	if !strings.Contains(string(output), "--source and --target are required") {
		t.Fatalf("output = %s", output)
	}
}
