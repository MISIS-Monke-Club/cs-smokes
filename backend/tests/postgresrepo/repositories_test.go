package postgresrepo_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/auth"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/lineups"
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

func TestStoreListLineupsPushesFiltersIntoSQL(t *testing.T) {
	db, err := pgxmock.NewPool()
	if err != nil {
		t.Fatalf("new mock pool: %v", err)
	}
	defer db.Close()
	approved := true
	createdAt := pgtype.Timestamptz{Time: time.Date(2026, 6, 30, 8, 0, 0, 0, time.UTC), Valid: true}

	db.ExpectQuery("from lineups l\\s+join users u").
		WithArgs(
			pgtype.Bool{Bool: true, Valid: true},
			pgtype.Text{String: "dust", Valid: true},
			pgtype.Text{String: "alice", Valid: true},
			"-date_of_creation",
		).
		WillReturnRows(lineupRows().AddRow(
			int32(10),
			int32(2),
			int32(7),
			int32(3),
			nil,
			"Dust lineup",
			nil,
			true,
			int32(42),
			nil,
			createdAt,
		))
	db.ExpectQuery("from users\nwhere user_id = \\$1").
		WithArgs(int32(7)).
		WillReturnRows(userRecordRows().AddRow(int32(7), "alice", nil, nil, nil, nil, nil, nil, nil, false))
	db.ExpectQuery("from grenade_classes\nwhere grenade_class_id = \\$1").
		WithArgs(int32(3)).
		WillReturnRows(grenadeClassRows().AddRow(int32(3), "Smoke", nil, int32(0)))
	db.ExpectQuery("from lineup_properties lp").
		WithArgs(pgtype.Int4{Int32: 10, Valid: true}).
		WillReturnRows(lineupPropertyRows())
	db.ExpectQuery("from pull_requests\nwhere lineup_id = \\$1").
		WithArgs(int32(10)).
		WillReturnError(pgx.ErrNoRows)

	rows, err := postgresrepo.New(db).ListLineups(context.Background(), lineups.Filter{
		IsApproved: &approved,
		Ordering:   "-date_of_creation",
		Query:      "dust",
		ByUserName: "alice",
	})
	if err != nil {
		t.Fatalf("ListLineups: %v", err)
	}
	if len(rows) != 1 || rows[0].GrenadeID != 10 || rows[0].Creator.Username != "alice" {
		t.Fatalf("rows = %#v", rows)
	}
	if err := db.ExpectationsWereMet(); err != nil {
		t.Fatalf("expectations: %v", err)
	}
}

func TestStoreSetUserRolesReplacesRoleCodes(t *testing.T) {
	db, err := pgxmock.NewPool()
	if err != nil {
		t.Fatalf("new mock pool: %v", err)
	}
	defer db.Close()
	db.ExpectExec("delete from user_admin_roles").
		WithArgs(int32(7)).
		WillReturnResult(pgxmock.NewResult("DELETE", 2))
	db.ExpectExec("insert into user_admin_roles").
		WithArgs(int32(7), "base_admin").
		WillReturnResult(pgxmock.NewResult("INSERT", 1))
	db.ExpectExec("insert into user_admin_roles").
		WithArgs(int32(7), "editor").
		WillReturnResult(pgxmock.NewResult("INSERT", 1))

	err = postgresrepo.New(db).SetUserRoles(context.Background(), 7, auth.RoleSet{IsBaseAdmin: true, IsEditor: true})
	if err != nil {
		t.Fatalf("SetUserRoles: %v", err)
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

func lineupRows() *pgxmock.Rows {
	return pgxmock.NewRows([]string{
		"grenade_id",
		"map_id",
		"user_id",
		"grenade_class_id",
		"link_to_video",
		"title",
		"description",
		"is_approved",
		"views",
		"preview_image_path",
		"created_at",
	})
}

func grenadeClassRows() *pgxmock.Rows {
	return pgxmock.NewRows([]string{
		"grenade_class_id",
		"name",
		"description",
		"price",
	})
}

func lineupPropertyRows() *pgxmock.Rows {
	return pgxmock.NewRows([]string{
		"property_id",
		"grenade_id",
		"name",
		"value",
	})
}
