package migratedjango_test

import (
	"context"
	"testing"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/migratedjango"
	"github.com/pashagolub/pgxmock/v4"
)

func TestLoadFromConnectionsResetsSequencesBeforeCheckingThem(t *testing.T) {
	db, err := pgxmock.NewPool()
	if err != nil {
		t.Fatalf("new mock pool: %v", err)
	}
	defer db.Close()
	expectEmptySourceSnapshot(db)
	for i := 0; i < 8; i++ {
		db.ExpectExec("select setval").WillReturnResult(pgxmock.NewResult("SELECT", 1))
	}
	for i := 0; i < 8; i++ {
		db.ExpectQuery("select coalesce\\(max").
			WillReturnRows(pgxmock.NewRows([]string{"max_id", "last_value", "is_called"}).AddRow(0, 1, false))
	}

	result, err := migratedjango.LoadFromConnections(context.Background(), db, db, migratedjango.Config{})
	if err != nil {
		t.Fatalf("LoadFromConnections: %v", err)
	}
	if result.Report.HasBlockers() {
		t.Fatalf("unexpected blockers: %s", result.Report.String())
	}
	if len(result.Snapshot.Sequences) != 8 {
		t.Fatalf("sequence checks = %#v", result.Snapshot.Sequences)
	}
	if err := db.ExpectationsWereMet(); err != nil {
		t.Fatalf("expectations: %v", err)
	}
}

func expectEmptySourceSnapshot(db pgxmock.PgxPoolIface) {
	db.ExpectQuery("select user_id, username, email").
		WillReturnRows(pgxmock.NewRows([]string{
			"user_id",
			"username",
			"email",
			"password",
			"first_name",
			"last_name",
			"avatar_url",
			"steam_link",
			"tg_id",
			"is_banned",
		}))
	db.ExpectQuery("select a.user_id_id").
		WillReturnRows(pgxmock.NewRows([]string{"user_id_id", "is_superuser", "is_base_admin", "is_editor"}))
	db.ExpectQuery("select map_id, name, link").
		WillReturnRows(pgxmock.NewRows([]string{"map_id", "name", "link", "is_esports_pool", "image_link"}))
	db.ExpectQuery("select grenade_class_id, name").
		WillReturnRows(pgxmock.NewRows([]string{"grenade_class_id", "name", "description", "price"}))
	db.ExpectQuery("select grenade_id, map_id_id").
		WillReturnRows(pgxmock.NewRows([]string{
			"grenade_id",
			"map_id_id",
			"user_id_id",
			"grenade_class_id_id",
			"link_to_video",
			"title",
			"description",
			"is_approved",
			"views",
			"preview_image_link",
			"created_at",
		}))
	db.ExpectQuery("select property_id, name").
		WillReturnRows(pgxmock.NewRows([]string{"property_id", "name", "value"}))
	db.ExpectQuery("select property_id_id, grenade_id_id").
		WillReturnRows(pgxmock.NewRows([]string{"property_id_id", "grenade_id_id"}))
	db.ExpectQuery("select user_id_id, grenade_id_id").
		WillReturnRows(pgxmock.NewRows([]string{"user_id_id", "grenade_id_id", "created_at"}))
	db.ExpectQuery("select id, lineup_id_id").
		WillReturnRows(pgxmock.NewRows([]string{"id", "lineup_id_id", "creator_id", "approver_id", "status", "created_at", "closed_at"}))
	db.ExpectQuery("select id, pull_request_id").
		WillReturnRows(pgxmock.NewRows([]string{"id", "pull_request_id", "author_id", "text", "created_at"}))
}
