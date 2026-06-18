package migratedjango_test

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/migratedjango"
	"github.com/pashagolub/pgxmock/v4"
)

func TestReportBlocksOrphansRemapsDuplicateTelegramMediaAndSequences(t *testing.T) {
	sourceMedia := t.TempDir()
	targetMedia := t.TempDir()
	writeFile(t, filepath.Join(sourceMedia, "maps", "mirage.png"))

	report := migratedjango.Validate(migratedjango.Snapshot{
		SourceMediaRoot: sourceMedia,
		TargetMediaRoot: targetMedia,
		Users: []migratedjango.UserRow{
			{SourceID: 1, TargetID: 1, TelegramID: int64Ptr(123)},
			{SourceID: 2, TargetID: 2, TelegramID: int64Ptr(123)},
		},
		Maps: []migratedjango.MapRow{
			{SourceID: 10, TargetID: 11, ImagePath: stringPtr("maps/mirage.png")},
		},
		Lineups: []migratedjango.LineupRow{
			{SourceID: 20, TargetID: 20, UserID: 404, MapID: 10, GrenadeClassID: 30},
		},
		GrenadeClasses: []migratedjango.IDPair{{SourceID: 30, TargetID: 30}},
		Sequences: []migratedjango.SequenceCheck{
			{Table: "users", Column: "user_id", MaxID: 2, NextValue: 2},
		},
	})

	if !report.HasBlockers() {
		t.Fatalf("expected blockers: %#v", report)
	}
	assertContains(t, report, "lineups:20 missing users:404")
	assertContains(t, report, "maps id remap source=10 target=11")
	assertContains(t, report, "duplicate tg_id 123")
	assertContains(t, report, "missing target media maps/mirage.png")
	assertContains(t, report, "users.user_id next=2 max=2")
}

func TestReportPassesForPreservedIDsValidParentsMediaAndSequences(t *testing.T) {
	sourceMedia := t.TempDir()
	targetMedia := t.TempDir()
	writeFile(t, filepath.Join(sourceMedia, "lineups", "smoke.png"))
	writeFile(t, filepath.Join(targetMedia, "lineups", "smoke.png"))

	report := migratedjango.Validate(migratedjango.Snapshot{
		SourceMediaRoot: sourceMedia,
		TargetMediaRoot: targetMedia,
		Users:           []migratedjango.UserRow{{SourceID: 1, TargetID: 1}},
		Maps:            []migratedjango.MapRow{{SourceID: 2, TargetID: 2}},
		GrenadeClasses:  []migratedjango.IDPair{{SourceID: 3, TargetID: 3}},
		Lineups: []migratedjango.LineupRow{
			{SourceID: 4, TargetID: 4, UserID: 1, MapID: 2, GrenadeClassID: 3, PreviewPath: stringPtr("../../lineups/smoke.png")},
		},
		Sequences: []migratedjango.SequenceCheck{{Table: "lineups", Column: "grenade_id", MaxID: 4, NextValue: 5}},
	})

	if report.HasBlockers() {
		t.Fatalf("unexpected blockers: %s", report.String())
	}
}

func TestReadSnapshotBuildsValidationReportFromDjangoSource(t *testing.T) {
	sourceMedia := t.TempDir()
	targetMedia := t.TempDir()
	writeFile(t, filepath.Join(sourceMedia, "maps", "mirage.png"))
	now := time.Date(2026, 6, 18, 12, 0, 0, 0, time.UTC)
	db, err := pgxmock.NewPool()
	if err != nil {
		t.Fatalf("new mock pool: %v", err)
	}
	defer db.Close()
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
		}).
			AddRow(1, stringPtr("one"), stringPtr("one@example.test"), stringPtr("hash1"), nil, nil, nil, nil, int64Ptr(77), false).
			AddRow(2, stringPtr("two"), stringPtr("two@example.test"), stringPtr("hash2"), nil, nil, nil, nil, int64Ptr(77), false))
	db.ExpectQuery("select map_id, name, link").
		WillReturnRows(pgxmock.NewRows([]string{"map_id", "name", "link", "is_esports_pool", "image_link"}).
			AddRow(10, "Mirage", nil, true, stringPtr("maps/mirage.png")))
	db.ExpectQuery("select grenade_class_id, name").
		WillReturnRows(pgxmock.NewRows([]string{"grenade_class_id", "name", "description", "price"}).
			AddRow(30, "Smoke", nil, 300))
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
		}).
			AddRow(20, 10, 404, 30, nil, "Window smoke", nil, true, 0, nil, now))
	db.ExpectQuery("select property_id, name").
		WillReturnRows(pgxmock.NewRows([]string{"property_id", "name", "value"}))
	db.ExpectQuery("select id, lineup_id_id").
		WillReturnRows(pgxmock.NewRows([]string{"id", "lineup_id_id", "creator_id", "approver_id", "status", "created_at", "closed_at"}))
	db.ExpectQuery("select id, pull_request_id").
		WillReturnRows(pgxmock.NewRows([]string{"id", "pull_request_id", "author_id", "text", "created_at"}))

	snapshot, err := migratedjango.ReadSnapshot(context.Background(), db, migratedjango.Config{
		SourceMediaRoot: sourceMedia,
		TargetMediaRoot: targetMedia,
	})
	if err != nil {
		t.Fatalf("ReadSnapshot: %v", err)
	}
	report := migratedjango.Validate(snapshot)

	if len(snapshot.Users) != 2 || len(snapshot.Maps) != 1 || len(snapshot.Lineups) != 1 {
		t.Fatalf("snapshot counts = %#v", snapshot)
	}
	assertContains(t, report, "duplicate tg_id 77")
	assertContains(t, report, "lineups:20 missing users:404")
	assertContains(t, report, "missing target media maps/mirage.png")
	if err := db.ExpectationsWereMet(); err != nil {
		t.Fatalf("expectations: %v", err)
	}
}

func assertContains(t *testing.T, report migratedjango.Report, expected string) {
	t.Helper()
	if !strings.Contains(report.String(), expected) {
		t.Fatalf("report missing %q:\n%s", expected, report.String())
	}
}

func writeFile(t *testing.T, path string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatalf("mkdir: %v", err)
	}
	if err := os.WriteFile(path, nil, 0o600); err != nil {
		t.Fatalf("write: %v", err)
	}
}

func int64Ptr(value int64) *int64 {
	return &value
}

func stringPtr(value string) *string {
	return &value
}
