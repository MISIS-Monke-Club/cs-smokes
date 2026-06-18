package main

import (
	"context"
	"flag"
	"fmt"
	"os"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/migratedjango"
)

func main() {
	var cfg migratedjango.Config
	flag.StringVar(&cfg.SourceDSN, "source", "", "source Django PostgreSQL DSN")
	flag.StringVar(&cfg.TargetDSN, "target", "", "target Go PostgreSQL DSN")
	flag.StringVar(&cfg.SourceMediaRoot, "source-media", "", "source Django media root")
	flag.StringVar(&cfg.TargetMediaRoot, "target-media", "", "target Go media root")
	flag.BoolVar(&cfg.DryRun, "dry-run", false, "validate and print migration report without loading")
	flag.Parse()
	cfg.Output = os.Stdout

	if err := migratedjango.Run(context.Background(), cfg); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
