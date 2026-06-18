package auth_test

import (
	"testing"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/auth"
)

func TestIssueAndParseAccessTokenPreservesUserClaims(t *testing.T) {
	claims := auth.UserClaims{
		UserID:      42,
		Username:    "admin",
		IsSuperuser: true,
		IsBaseAdmin: true,
		IsEditor:    false,
	}

	pair, err := auth.IssueTokenPair("secret", claims)
	if err != nil {
		t.Fatalf("IssueTokenPair returned error: %v", err)
	}
	parsed, err := auth.ParseAccessToken("secret", pair.AccessToken)
	if err != nil {
		t.Fatalf("ParseAccessToken returned error: %v", err)
	}
	if parsed != claims {
		t.Fatalf("claims = %#v, want %#v", parsed, claims)
	}
	if pair.RefreshToken == "" {
		t.Fatalf("RefreshToken is empty")
	}
}
