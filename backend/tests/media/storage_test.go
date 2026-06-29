package media_test

import (
	"mime/multipart"
	"net/http"
	"net/textproto"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/media"
)

func TestPublicURLBuildsAbsoluteMediaURL(t *testing.T) {
	path := "maps/mirage.png"
	got := media.PublicURL("http://localhost:3000/", &path)
	if got == nil || *got != "http://localhost:3000/media/maps/mirage.png" {
		t.Fatalf("PublicURL = %#v", got)
	}
	if media.PublicURL("http://localhost:3000", nil) != nil {
		t.Fatalf("nil media path must stay nil")
	}
}

func TestValidateMediaPathAllowsOnlyKnownFolders(t *testing.T) {
	for _, path := range []string{"maps/mirage.png", "lineups/smoke.jpg"} {
		if err := media.ValidateMediaPath(path); err != nil {
			t.Fatalf("ValidateMediaPath(%q) returned %v", path, err)
		}
	}
	for _, path := range []string{"../secret", "avatars/a.png", "/maps/a.png"} {
		if err := media.ValidateMediaPath(path); err == nil {
			t.Fatalf("ValidateMediaPath(%q) unexpectedly passed", path)
		}
	}
}

func TestSaveMultipartFileValidatesTypeSizeAndFolder(t *testing.T) {
	root := t.TempDir()
	header := fileHeader("mirage.png", "image/png", 3)
	stored, err := media.SaveMultipartFile(root, "maps", strings.NewReader("png"), header)
	if err != nil {
		t.Fatalf("SaveMultipartFile returned error: %v", err)
	}
	if stored != "maps/mirage.png" {
		t.Fatalf("stored path = %q", stored)
	}
	if _, err := os.Stat(filepath.Join(root, stored)); err != nil {
		t.Fatalf("saved file missing: %v", err)
	}

	if _, err := media.SaveMultipartFile(root, "avatars", strings.NewReader("png"), header); err == nil {
		t.Fatalf("invalid folder unexpectedly passed")
	}
	octetStreamJPG := fileHeader("fallback.jpg", "application/octet-stream", 3)
	stored, err = media.SaveMultipartFile(root, "lineups", strings.NewReader("jpg"), octetStreamJPG)
	if err != nil {
		t.Fatalf("octet stream jpg fallback returned error: %v", err)
	}
	if stored != "lineups/fallback.jpg" {
		t.Fatalf("octet stream stored path = %q", stored)
	}
	badType := fileHeader("mirage.gif", "image/gif", 3)
	if _, err := media.SaveMultipartFile(root, "maps", strings.NewReader("gif"), badType); err == nil {
		t.Fatalf("invalid content type unexpectedly passed")
	}
	tooLarge := fileHeader("huge.png", "image/png", media.MaxImageBytes+1)
	if _, err := media.SaveMultipartFile(root, "maps", strings.NewReader("png"), tooLarge); err == nil {
		t.Fatalf("oversized file unexpectedly passed")
	}
}

func TestDetectContentTypeDelegatesToHTTPDetection(t *testing.T) {
	prefix := []byte("\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR")
	if got, want := media.DetectContentType(prefix), http.DetectContentType(prefix); got != want {
		t.Fatalf("DetectContentType = %q, want %q", got, want)
	}
}

func fileHeader(name string, contentType string, size int64) *multipart.FileHeader {
	header := make(textproto.MIMEHeader)
	header.Set("Content-Type", contentType)
	return &multipart.FileHeader{Filename: name, Header: header, Size: size}
}
