package migratedjango

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Source interface {
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
}

type LoadResult struct {
	Snapshot Snapshot
	Report   Report
}

func Load(ctx context.Context, cfg Config) (LoadResult, error) {
	if cfg.SourceDSN == "" || cfg.TargetDSN == "" {
		return LoadResult{}, fmt.Errorf("--source and --target are required for load mode")
	}
	source, err := pgxpool.New(ctx, cfg.SourceDSN)
	if err != nil {
		return LoadResult{}, err
	}
	defer source.Close()
	target, err := pgxpool.New(ctx, cfg.TargetDSN)
	if err != nil {
		return LoadResult{}, err
	}
	defer target.Close()

	tx, err := target.Begin(ctx)
	if err != nil {
		return LoadResult{}, err
	}
	defer tx.Rollback(ctx)

	result, err := LoadFromConnections(ctx, source, tx, cfg)
	if err != nil {
		return result, err
	}
	if err := tx.Commit(ctx); err != nil {
		return LoadResult{}, err
	}
	return result, nil
}

func LoadFromConnections(ctx context.Context, source Source, target pgx.Tx, cfg Config) (LoadResult, error) {
	snapshot, err := loadRows(ctx, source, target, cfg)
	if err != nil {
		return LoadResult{}, err
	}
	if err := resetSequences(ctx, target); err != nil {
		return LoadResult{}, err
	}
	sequences, err := sequenceChecks(ctx, target)
	if err != nil {
		return LoadResult{}, err
	}
	snapshot.Sequences = sequences
	report := Validate(snapshot)
	if report.HasBlockers() {
		return LoadResult{Snapshot: snapshot, Report: report}, fmt.Errorf("migration validation failed")
	}
	return LoadResult{Snapshot: snapshot, Report: report}, nil
}

func ReadSnapshot(ctx context.Context, source Source, cfg Config) (Snapshot, error) {
	return loadRows(ctx, source, nil, cfg)
}

func loadRows(ctx context.Context, source Source, target pgx.Tx, cfg Config) (Snapshot, error) {
	snapshot := Snapshot{SourceMediaRoot: cfg.SourceMediaRoot, TargetMediaRoot: cfg.TargetMediaRoot}
	users, err := source.Query(ctx, `select user_id, username, email, password, first_name, last_name, avatar_url, steam_link, tg_id, is_banned from auth_app_user order by user_id`)
	if err != nil {
		return snapshot, err
	}
	for users.Next() {
		var row struct {
			id                                                                   int
			username, email, password, firstName, lastName, avatarURL, steamLink *string
			tgID                                                                 *int64
			isBanned                                                             bool
		}
		if err := users.Scan(&row.id, &row.username, &row.email, &row.password, &row.firstName, &row.lastName, &row.avatarURL, &row.steamLink, &row.tgID, &row.isBanned); err != nil {
			users.Close()
			return snapshot, err
		}
		username := ""
		if row.username != nil {
			username = *row.username
		}
		if target != nil {
			_, err := target.Exec(ctx, `insert into users (user_id, username, email, password_hash, first_name, last_name, avatar_url, steam_link, tg_id, is_banned) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) on conflict (user_id) do nothing`,
				row.id, username, row.email, row.password, row.firstName, row.lastName, row.avatarURL, row.steamLink, row.tgID, row.isBanned)
			if err != nil {
				users.Close()
				return snapshot, err
			}
		}
		snapshot.Users = append(snapshot.Users, UserRow{SourceID: row.id, TargetID: row.id, TelegramID: row.tgID})
	}
	users.Close()
	if err := users.Err(); err != nil {
		return snapshot, err
	}

	if target != nil {
		if err := loadAdminRoles(ctx, source, target); err != nil {
			return snapshot, err
		}
	}
	if err := loadMaps(ctx, source, target, cfg, &snapshot); err != nil {
		return snapshot, err
	}
	if err := loadGrenadeClasses(ctx, source, target, &snapshot); err != nil {
		return snapshot, err
	}
	if err := loadLineups(ctx, source, target, cfg, &snapshot); err != nil {
		return snapshot, err
	}
	if err := loadProperties(ctx, source, target, &snapshot); err != nil {
		return snapshot, err
	}
	if target != nil {
		if err := loadRelations(ctx, source, target); err != nil {
			return snapshot, err
		}
	}
	if err := loadPullRequests(ctx, source, target, &snapshot); err != nil {
		return snapshot, err
	}
	if err := loadComments(ctx, source, target, &snapshot); err != nil {
		return snapshot, err
	}
	return snapshot, nil
}

func loadAdminRoles(ctx context.Context, source Source, target pgx.Tx) error {
	rows, err := source.Query(ctx, `select a.user_id_id, t.is_superuser, t.is_base_admin, t.is_editor from auth_app_admins a join auth_app_admintype t on t.admin_type_id = a.admin_type_id_id`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var userID int
		var superuser, baseAdmin, editor bool
		if err := rows.Scan(&userID, &superuser, &baseAdmin, &editor); err != nil {
			return err
		}
		for roleID, enabled := range map[int]bool{1: superuser, 2: baseAdmin, 3: editor} {
			if enabled {
				if _, err := target.Exec(ctx, `insert into user_admin_roles (user_id, role_id) values ($1,$2) on conflict do nothing`, userID, roleID); err != nil {
					return err
				}
			}
		}
	}
	return rows.Err()
}

func loadMaps(ctx context.Context, source Source, target pgx.Tx, cfg Config, snapshot *Snapshot) error {
	rows, err := source.Query(ctx, `select map_id, name, link, is_esports_pool, image_link from maps_map order by map_id`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var id int
		var name string
		var link, imagePath *string
		var esports bool
		if err := rows.Scan(&id, &name, &link, &esports, &imagePath); err != nil {
			return err
		}
		if target != nil {
			if err := copyMedia(cfg, imagePath); err != nil {
				return err
			}
			if _, err := target.Exec(ctx, `insert into maps (map_id, name, link, is_esports_pool, image_path) values ($1,$2,$3,$4,$5) on conflict (map_id) do nothing`, id, name, link, esports, imagePath); err != nil {
				return err
			}
		}
		snapshot.Maps = append(snapshot.Maps, MapRow{SourceID: id, TargetID: id, ImagePath: imagePath})
	}
	return rows.Err()
}

func loadGrenadeClasses(ctx context.Context, source Source, target pgx.Tx, snapshot *Snapshot) error {
	rows, err := source.Query(ctx, `select grenade_class_id, name, description, price from grenade_class_grenadeclass order by grenade_class_id`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var id, price int
		var name string
		var description *string
		if err := rows.Scan(&id, &name, &description, &price); err != nil {
			return err
		}
		if target != nil {
			if _, err := target.Exec(ctx, `insert into grenade_classes (grenade_class_id, name, description, price) values ($1,$2,$3,$4) on conflict (grenade_class_id) do nothing`, id, name, description, price); err != nil {
				return err
			}
		}
		snapshot.GrenadeClasses = append(snapshot.GrenadeClasses, IDPair{SourceID: id, TargetID: id})
	}
	return rows.Err()
}

func loadLineups(ctx context.Context, source Source, target pgx.Tx, cfg Config, snapshot *Snapshot) error {
	rows, err := source.Query(ctx, `select grenade_id, map_id_id, user_id_id, grenade_class_id_id, link_to_video, title, description, is_approved, views, preview_image_link, created_at from lineups_lineup order by grenade_id`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var id, mapID, userID, classID, views int
		var link, description, preview *string
		var title string
		var createdAt time.Time
		var approved bool
		if err := rows.Scan(&id, &mapID, &userID, &classID, &link, &title, &description, &approved, &views, &preview, &createdAt); err != nil {
			return err
		}
		if target != nil {
			if err := copyMedia(cfg, preview); err != nil {
				return err
			}
			if _, err := target.Exec(ctx, `insert into lineups (grenade_id, map_id, user_id, grenade_class_id, link_to_video, title, description, is_approved, views, preview_image_path, created_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) on conflict (grenade_id) do nothing`, id, mapID, userID, classID, link, title, description, approved, views, preview, createdAt); err != nil {
				return err
			}
		}
		snapshot.Lineups = append(snapshot.Lineups, LineupRow{SourceID: id, TargetID: id, UserID: userID, MapID: mapID, GrenadeClassID: classID, PreviewPath: preview})
	}
	return rows.Err()
}

func loadProperties(ctx context.Context, source Source, target pgx.Tx, snapshot *Snapshot) error {
	rows, err := source.Query(ctx, `select property_id, name, value from properties_property order by property_id`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var id int
		var name string
		var value *string
		if err := rows.Scan(&id, &name, &value); err != nil {
			return err
		}
		if target != nil {
			if _, err := target.Exec(ctx, `insert into properties (property_id, name, value) values ($1,$2,$3) on conflict (property_id) do nothing`, id, name, value); err != nil {
				return err
			}
		}
		snapshot.Properties = append(snapshot.Properties, IDPair{SourceID: id, TargetID: id})
	}
	return rows.Err()
}

func loadRelations(ctx context.Context, source Source, target pgx.Tx) error {
	if err := copyRows(ctx, source, target, `select property_id_id, grenade_id_id from properties_propertylist`, `insert into lineup_properties (property_id, grenade_id) values ($1,$2) on conflict do nothing`); err != nil {
		return err
	}
	return copyRows(ctx, source, target, `select user_id_id, grenade_id_id, created_at from favorites_favorites`, `insert into favorites (user_id, grenade_id, created_at) values ($1,$2,$3) on conflict do nothing`)
}

func loadPullRequests(ctx context.Context, source Source, target pgx.Tx, snapshot *Snapshot) error {
	rows, err := source.Query(ctx, `select id, lineup_id_id, creator_id, approver_id, status, created_at, closed_at from pull_requests_pullrequest order by id`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var id, lineupID, creatorID int
		var approverID *int
		var status string
		var createdAt time.Time
		var closedAt *time.Time
		if err := rows.Scan(&id, &lineupID, &creatorID, &approverID, &status, &createdAt, &closedAt); err != nil {
			return err
		}
		if target != nil {
			if _, err := target.Exec(ctx, `insert into pull_requests (id, lineup_id, creator_id, approver_id, status, created_at, closed_at) values ($1,$2,$3,$4,$5,$6,$7) on conflict (id) do nothing`, id, lineupID, creatorID, approverID, status, createdAt, closedAt); err != nil {
				return err
			}
		}
		snapshot.PullRequests = append(snapshot.PullRequests, PullRequestRow{SourceID: id, TargetID: id, LineupID: lineupID, CreatorID: creatorID, ApproverID: approverID})
	}
	return rows.Err()
}

func loadComments(ctx context.Context, source Source, target pgx.Tx, snapshot *Snapshot) error {
	rows, err := source.Query(ctx, `select id, pull_request_id, author_id, text, created_at from pull_requests_comment order by id`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var id, prID, authorID int
		var text string
		var createdAt time.Time
		if err := rows.Scan(&id, &prID, &authorID, &text, &createdAt); err != nil {
			return err
		}
		if target != nil {
			if _, err := target.Exec(ctx, `insert into comments (id, pull_request_id, author_id, text, created_at) values ($1,$2,$3,$4,$5) on conflict (id) do nothing`, id, prID, authorID, text, createdAt); err != nil {
				return err
			}
		}
		snapshot.Comments = append(snapshot.Comments, CommentRow{SourceID: id, TargetID: id, PullRequestID: prID, AuthorID: authorID})
	}
	return rows.Err()
}

func copyRows(ctx context.Context, source Source, target pgx.Tx, query string, insert string) error {
	rows, err := source.Query(ctx, query)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		values, err := rows.Values()
		if err != nil {
			return err
		}
		if _, err := target.Exec(ctx, insert, values...); err != nil {
			return err
		}
	}
	return rows.Err()
}

func resetSequences(ctx context.Context, target pgx.Tx) error {
	for _, sequence := range preservedSequences() {
		query := fmt.Sprintf(
			`select setval(pg_get_serial_sequence('%s', '%s'), greatest(coalesce((select max(%s) from %s), 0), 1), coalesce((select max(%s) from %s), 0) > 0)`,
			sequence.Table,
			sequence.Column,
			sequence.Column,
			sequence.Table,
			sequence.Column,
			sequence.Table,
		)
		if _, err := target.Exec(ctx, query); err != nil {
			return err
		}
	}
	return nil
}

func sequenceChecks(ctx context.Context, target pgx.Tx) ([]SequenceCheck, error) {
	checks := make([]SequenceCheck, 0, len(preservedSequences()))
	for _, sequence := range preservedSequences() {
		var maxID, lastValue int
		var isCalled bool
		query := fmt.Sprintf(`select coalesce(max(%s), 0)::int, (select last_value::int from %s), (select is_called from %s) from %s`, sequence.Column, sequence.Sequence, sequence.Sequence, sequence.Table)
		if err := target.QueryRow(ctx, query).Scan(&maxID, &lastValue, &isCalled); err != nil {
			return nil, err
		}
		nextValue := lastValue
		if isCalled {
			nextValue = lastValue + 1
		}
		checks = append(checks, SequenceCheck{Table: sequence.Table, Column: sequence.Column, MaxID: maxID, NextValue: nextValue})
	}
	return checks, nil
}

type sequenceRef struct {
	Table    string
	Column   string
	Sequence string
}

func preservedSequences() []sequenceRef {
	return []sequenceRef{
		{Table: "users", Column: "user_id", Sequence: "users_user_id_seq"},
		{Table: "admin_roles", Column: "role_id", Sequence: "admin_roles_role_id_seq"},
		{Table: "maps", Column: "map_id", Sequence: "maps_map_id_seq"},
		{Table: "grenade_classes", Column: "grenade_class_id", Sequence: "grenade_classes_grenade_class_id_seq"},
		{Table: "lineups", Column: "grenade_id", Sequence: "lineups_grenade_id_seq"},
		{Table: "properties", Column: "property_id", Sequence: "properties_property_id_seq"},
		{Table: "pull_requests", Column: "id", Sequence: "pull_requests_id_seq"},
		{Table: "comments", Column: "id", Sequence: "comments_id_seq"},
	}
}

func copyMedia(cfg Config, mediaPath *string) error {
	if mediaPath == nil || *mediaPath == "" || cfg.SourceMediaRoot == "" || cfg.TargetMediaRoot == "" {
		return nil
	}
	clean := cleanMediaPath(*mediaPath)
	source := filepath.Join(cfg.SourceMediaRoot, clean)
	target := filepath.Join(cfg.TargetMediaRoot, clean)
	input, err := os.Open(source)
	if os.IsNotExist(err) {
		return nil
	}
	if err != nil {
		return err
	}
	defer input.Close()
	if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
		return err
	}
	output, err := os.Create(target)
	if err != nil {
		return err
	}
	defer output.Close()
	_, err = io.Copy(output, input)
	return err
}
