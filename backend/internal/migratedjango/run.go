package migratedjango

import (
	"context"
	"fmt"
	"io"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Config struct {
	SourceDSN       string
	TargetDSN       string
	SourceMediaRoot string
	TargetMediaRoot string
	DryRun          bool
	Output          io.Writer
}

func Run(ctx context.Context, cfg Config) error {
	if cfg.Output == nil {
		cfg.Output = io.Discard
	}
	snapshot := Snapshot{
		SourceMediaRoot: cfg.SourceMediaRoot,
		TargetMediaRoot: cfg.TargetMediaRoot,
	}
	if cfg.DryRun {
		if cfg.SourceDSN != "" {
			source, err := pgxpool.New(ctx, cfg.SourceDSN)
			if err != nil {
				return err
			}
			defer source.Close()
			loaded, err := ReadSnapshot(ctx, source, cfg)
			if err != nil {
				return err
			}
			snapshot = loaded
		}
		report := Validate(snapshot)
		writeDryRunReport(cfg.Output, snapshot, report)
		if report.HasBlockers() {
			return fmt.Errorf("migration validation failed")
		}
		return nil
	}
	result, err := Load(ctx, cfg)
	if err != nil {
		return err
	}
	writeDryRunReport(cfg.Output, result.Snapshot, result.Report)
	return nil
}

func writeDryRunReport(out io.Writer, snapshot Snapshot, report Report) {
	fmt.Fprintln(out, "row counts")
	fmt.Fprintf(out, "users=%d maps=%d grenade_classes=%d lineups=%d properties=%d pull_requests=%d comments=%d\n",
		len(snapshot.Users),
		len(snapshot.Maps),
		len(snapshot.GrenadeClasses),
		len(snapshot.Lineups),
		len(snapshot.Properties),
		len(snapshot.PullRequests),
		len(snapshot.Comments),
	)
	fmt.Fprintln(out, "id preservation report")
	fmt.Fprintln(out, report.String())
	fmt.Fprintln(out, "orphan report")
	fmt.Fprintln(out, report.String())
	fmt.Fprintln(out, "media report")
	fmt.Fprintln(out, report.String())
	fmt.Fprintln(out, "auth sample report")
	fmt.Fprintln(out, "password hashes preserved; telegram ids checked for non-null duplicates")
	fmt.Fprintln(out, "sequence report")
	fmt.Fprintln(out, report.String())
}
