package auth_test

import (
	"testing"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/auth"
)

func TestVerifyDjangoPBKDF2Password(t *testing.T) {
	hash := "pbkdf2_sha256$720000$testsalt$61IgY/P6T7Qtowk/Vb2vNgc5TzaGURpWPHcfpIzPBUc="

	ok, err := auth.VerifyPassword("password", hash)

	if err != nil {
		t.Fatalf("VerifyPassword returned error: %v", err)
	}
	if !ok {
		t.Fatalf("known-good Django PBKDF2 hash did not verify")
	}
}

func TestRejectUnknownPasswordAlgorithm(t *testing.T) {
	ok, err := auth.VerifyPassword("password", "unknown$hash")
	if err == nil {
		t.Fatalf("expected error for unknown algorithm")
	}
	if ok {
		t.Fatalf("unknown algorithm must not verify")
	}
}
