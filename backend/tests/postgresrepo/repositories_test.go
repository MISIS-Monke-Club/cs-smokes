package postgresrepo_test

import (
	"context"
	"errors"
	"testing"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/platform/postgresrepo"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/users"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/pashagolub/pgxmock/v4"
)

func TestRepositoryFactoryBuildsHTTPServerBundle(t *testing.T) {
	repos := postgresrepo.New(nil).Repositories()

	if repos.Auth == nil ||
		repos.Users == nil ||
		repos.GrenadeClasses == nil ||
		repos.Maps == nil ||
		repos.Lineups == nil ||
		repos.Properties == nil ||
		repos.Favorites == nil ||
		repos.PullRequests == nil ||
		repos.Realtime == nil {
		t.Fatalf("repository bundle has nil entries: %#v", repos)
	}
}

func TestStoreListUsersMapsNullableFields(t *testing.T) {
	db, err := pgxmock.NewPool()
	if err != nil {
		t.Fatalf("new mock pool: %v", err)
	}
	defer db.Close()
	db.ExpectQuery("select user_id, username, email").
		WillReturnRows(
			pgxmock.NewRows([]string{
				"user_id",
				"username",
				"email",
				"first_name",
				"last_name",
				"avatar_url",
				"steam_link",
				"tg_id",
				"is_banned",
			}).AddRow(int32(7), "player", "p@example.com", nil, nil, nil, nil, int64(99), false),
		)

	rows, err := postgresrepo.New(db).ListUsers(context.Background())
	if err != nil {
		t.Fatalf("ListUsers: %v", err)
	}
	if len(rows) != 1 || rows[0].UserID != 7 || rows[0].Email == nil || *rows[0].Email != "p@example.com" || rows[0].TgID == nil || *rows[0].TgID != 99 {
		t.Fatalf("rows = %#v", rows)
	}
	if err := db.ExpectationsWereMet(); err != nil {
		t.Fatalf("expectations: %v", err)
	}
}

func TestStoreCreateUserMapsUniqueConstraintToDuplicateError(t *testing.T) {
	db, err := pgxmock.NewPool()
	if err != nil {
		t.Fatalf("new mock pool: %v", err)
	}
	defer db.Close()
	db.ExpectQuery("insert into users").
		WithArgs(
			pgxmock.AnyArg(),
			pgxmock.AnyArg(),
			pgxmock.AnyArg(),
			pgxmock.AnyArg(),
			pgxmock.AnyArg(),
			pgxmock.AnyArg(),
			pgxmock.AnyArg(),
			pgxmock.AnyArg(),
		).
		WillReturnError(&pgconn.PgError{Code: "23505", ConstraintName: "users_username_key"})

	_, err = postgresrepo.New(db).CreateUser(context.Background(), users.UserInput{Username: "player"})
	var duplicate users.DuplicateError
	if !errors.As(err, &duplicate) {
		t.Fatalf("err = %T %[1]v, want users.DuplicateError", err)
	}
	if len(duplicate.Fields) != 1 || duplicate.Fields[0] != "username" {
		t.Fatalf("duplicate fields = %#v", duplicate.Fields)
	}
	if err := db.ExpectationsWereMet(); err != nil {
		t.Fatalf("expectations: %v", err)
	}
}

func TestStorePatchUserPreservesExistingPasswordHash(t *testing.T) {
	db, err := pgxmock.NewPool()
	if err != nil {
		t.Fatalf("new mock pool: %v", err)
	}
	defer db.Close()
	db.ExpectQuery("where username = \\$1 or email = \\$1").
		WithArgs("").
		WillReturnError(pgx.ErrNoRows)
	db.ExpectQuery("from users\nwhere user_id = \\$1").
		WithArgs(int32(1)).
		WillReturnRows(userRecordRows().AddRow(int32(1), "player", "p@example.com", "oldhash", nil, nil, nil, nil, nil, false))
	db.ExpectQuery("update users").
		WithArgs(
			int32(1),
			"player",
			pgtype.Text{String: "p@example.com", Valid: true},
			pgtype.Text{String: "oldhash", Valid: true},
			pgtype.Text{String: "Patched", Valid: true},
			pgtype.Text{},
			pgtype.Text{},
			pgtype.Text{},
		).
		WillReturnRows(userRecordRows().AddRow(int32(1), "player", "p@example.com", "oldhash", "Patched", nil, nil, nil, nil, false))

	row, err := postgresrepo.New(db).PatchUser(context.Background(), 1, users.UserInput{FirstName: stringPtr("Patched")})
	if err != nil {
		t.Fatalf("PatchUser: %v", err)
	}
	if row.FirstName == nil || *row.FirstName != "Patched" {
		t.Fatalf("row = %#v", row)
	}
	if err := db.ExpectationsWereMet(); err != nil {
		t.Fatalf("expectations: %v", err)
	}
}

func userRecordRows() *pgxmock.Rows {
	return pgxmock.NewRows([]string{
		"user_id",
		"username",
		"email",
		"password_hash",
		"first_name",
		"last_name",
		"avatar_url",
		"steam_link",
		"tg_id",
		"is_banned",
	})
}

func stringPtr(value string) *string {
	return &value
}
