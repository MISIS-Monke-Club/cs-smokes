package repositoryerrors_test

import (
	"testing"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/favorites"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/lineups"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/maps"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/properties"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/users"
)

func TestRepositoryErrorStrings(t *testing.T) {
	for _, tc := range []struct {
		name string
		err  error
		want string
	}{
		{name: "favorite duplicate", err: favorites.DuplicateError{}, want: "duplicate favorite"},
		{name: "lineup validation", err: lineups.ValidationError{Fields: []string{"title", "map_id"}}, want: "invalid title, map_id"},
		{name: "map validation", err: maps.ValidationError{Fields: []string{"name"}}, want: "invalid name"},
		{name: "property validation", err: properties.ValidationError{Fields: []string{"value"}}, want: "invalid value"},
		{name: "property duplicate", err: properties.DuplicateError{}, want: "duplicate relation"},
		{name: "user duplicate", err: users.DuplicateError{Fields: []string{"username", "email"}}, want: "duplicate username, email"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			if got := tc.err.Error(); got != tc.want {
				t.Fatalf("Error() = %q, want %q", got, tc.want)
			}
		})
	}
}
