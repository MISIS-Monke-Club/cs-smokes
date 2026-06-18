package wsprobe_test

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

func TestWSRedactionProbeWritesSentinelsAndProductionConfig(t *testing.T) {
	dir := t.TempDir()
	cmd := exec.Command("go", "run", "../../tools/ws-redaction-probe", "--capture-dir", dir, "--secret-key", "secret", "--user-id", "7", "--write-sentinels-only")
	output, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("probe failed: %v\n%s", err, output)
	}
	sentinels, err := os.ReadFile(filepath.Join(dir, "sentinels.txt"))
	if err != nil {
		t.Fatalf("read sentinels: %v", err)
	}
	text := string(sentinels)
	for _, expected := range []string{"malformed.token.value", "expired.token.value"} {
		if !strings.Contains(text, expected) {
			t.Fatalf("sentinels missing %q: %s", expected, text)
		}
	}
	config, err := os.ReadFile(filepath.Join(dir, "effective-config.txt"))
	if err != nil {
		t.Fatalf("read effective config: %v", err)
	}
	if !strings.Contains(string(config), "WS_ALLOW_UNAUTHENTICATED_DEV=false") {
		t.Fatalf("effective config = %s", config)
	}
}
