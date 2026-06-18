package lineups_test

import (
	"net/url"
	"testing"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/lineups"
)

func TestParseFilterSupportsLegacyQueryParameters(t *testing.T) {
	values := url.Values{
		"is_approved":  []string{"true"},
		"ordering":     []string{"-date_of_creation"},
		"query":        []string{"window"},
		"by_user_name": []string{"player"},
		"creator_id":   []string{"123"},
	}

	filter := lineups.ParseFilter(values)

	if filter.IsApproved == nil || !*filter.IsApproved {
		t.Fatalf("IsApproved = %#v, want true pointer", filter.IsApproved)
	}
	if filter.Ordering != "-date_of_creation" {
		t.Fatalf("Ordering = %q", filter.Ordering)
	}
	if filter.Query != "window" {
		t.Fatalf("Query = %q", filter.Query)
	}
	if filter.ByUserName != "player" {
		t.Fatalf("ByUserName = %q", filter.ByUserName)
	}
	if filter.CreatorIDIgnored != "" {
		t.Fatalf("creator_id must be ignored, got %q", filter.CreatorIDIgnored)
	}
}

func TestParseFilterRejectsInvalidApprovedValue(t *testing.T) {
	filter := lineups.ParseFilter(url.Values{"is_approved": []string{"maybe"}})

	if filter.IsApproved != nil {
		t.Fatalf("invalid is_approved must be ignored, got %#v", filter.IsApproved)
	}
}
