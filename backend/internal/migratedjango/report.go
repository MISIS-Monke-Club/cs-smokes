package migratedjango

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

type Snapshot struct {
	SourceMediaRoot string
	TargetMediaRoot string
	Users           []UserRow
	Maps            []MapRow
	GrenadeClasses  []IDPair
	Lineups         []LineupRow
	Properties      []IDPair
	PullRequests    []PullRequestRow
	Comments        []CommentRow
	Sequences       []SequenceCheck
}

type IDPair struct {
	SourceID int
	TargetID int
}

type UserRow struct {
	SourceID   int
	TargetID   int
	TelegramID *int64
}

type MapRow struct {
	SourceID  int
	TargetID  int
	ImagePath *string
}

type LineupRow struct {
	SourceID       int
	TargetID       int
	UserID         int
	MapID          int
	GrenadeClassID int
	PreviewPath    *string
}

type PullRequestRow struct {
	SourceID   int
	TargetID   int
	LineupID   int
	CreatorID  int
	ApproverID *int
}

type CommentRow struct {
	SourceID      int
	TargetID      int
	PullRequestID int
	AuthorID      int
}

type SequenceCheck struct {
	Table     string
	Column    string
	MaxID     int
	NextValue int
}

type Finding struct {
	Kind    string
	Message string
	Blocker bool
}

type Report struct {
	Findings []Finding
}

func Validate(snapshot Snapshot) Report {
	var report Report
	userIDs := idSetFromUsers(snapshot.Users)
	mapIDs := idSetFromMaps(snapshot.Maps)
	classIDs := idSet(snapshot.GrenadeClasses)
	lineupIDs := idSetFromLineups(snapshot.Lineups)
	prIDs := idSetFromPullRequests(snapshot.PullRequests)

	checkPairs(&report, "users", userPairs(snapshot.Users))
	checkPairs(&report, "maps", mapPairs(snapshot.Maps))
	checkPairs(&report, "grenade_classes", snapshot.GrenadeClasses)
	checkPairs(&report, "lineups", lineupPairs(snapshot.Lineups))
	checkPairs(&report, "properties", snapshot.Properties)
	checkPairs(&report, "pull_requests", pullRequestPairs(snapshot.PullRequests))
	checkPairs(&report, "comments", commentPairs(snapshot.Comments))
	checkDuplicateTelegram(&report, snapshot.Users)
	checkMedia(&report, snapshot.SourceMediaRoot, snapshot.TargetMediaRoot, "maps", mapMedia(snapshot.Maps))
	checkMedia(&report, snapshot.SourceMediaRoot, snapshot.TargetMediaRoot, "lineups", lineupMedia(snapshot.Lineups))
	for _, row := range snapshot.Lineups {
		requireParent(&report, "lineups", row.SourceID, "users", row.UserID, userIDs)
		requireParent(&report, "lineups", row.SourceID, "maps", row.MapID, mapIDs)
		requireParent(&report, "lineups", row.SourceID, "grenade_classes", row.GrenadeClassID, classIDs)
	}
	for _, row := range snapshot.PullRequests {
		requireParent(&report, "pull_requests", row.SourceID, "lineups", row.LineupID, lineupIDs)
		requireParent(&report, "pull_requests", row.SourceID, "users", row.CreatorID, userIDs)
		if row.ApproverID != nil {
			requireParent(&report, "pull_requests", row.SourceID, "users", *row.ApproverID, userIDs)
		}
	}
	for _, row := range snapshot.Comments {
		requireParent(&report, "comments", row.SourceID, "pull_requests", row.PullRequestID, prIDs)
		requireParent(&report, "comments", row.SourceID, "users", row.AuthorID, userIDs)
	}
	for _, sequence := range snapshot.Sequences {
		if sequence.NextValue <= sequence.MaxID {
			report.add("sequence", fmt.Sprintf("%s.%s next=%d max=%d", sequence.Table, sequence.Column, sequence.NextValue, sequence.MaxID), true)
		}
	}
	return report
}

func (r Report) HasBlockers() bool {
	for _, finding := range r.Findings {
		if finding.Blocker {
			return true
		}
	}
	return false
}

func (r Report) String() string {
	if len(r.Findings) == 0 {
		return "migration report: no findings"
	}
	lines := make([]string, len(r.Findings))
	for i, finding := range r.Findings {
		status := "warning"
		if finding.Blocker {
			status = "blocker"
		}
		lines[i] = fmt.Sprintf("%s %s: %s", status, finding.Kind, finding.Message)
	}
	sort.Strings(lines)
	return strings.Join(lines, "\n")
}

func (r *Report) add(kind string, message string, blocker bool) {
	r.Findings = append(r.Findings, Finding{Kind: kind, Message: message, Blocker: blocker})
}

func checkPairs(report *Report, table string, rows []IDPair) {
	for _, row := range rows {
		if row.SourceID != row.TargetID {
			report.add("id", fmt.Sprintf("%s id remap source=%d target=%d", table, row.SourceID, row.TargetID), true)
		}
	}
}

func checkDuplicateTelegram(report *Report, users []UserRow) {
	seen := map[int64]int{}
	for _, user := range users {
		if user.TelegramID == nil {
			continue
		}
		if prev, ok := seen[*user.TelegramID]; ok {
			report.add("telegram", fmt.Sprintf("duplicate tg_id %d users=%d,%d", *user.TelegramID, prev, user.SourceID), true)
			continue
		}
		seen[*user.TelegramID] = user.SourceID
	}
}

func checkMedia(report *Report, sourceRoot string, targetRoot string, label string, paths []string) {
	for _, mediaPath := range paths {
		clean := cleanMediaPath(mediaPath)
		sourcePath := filepath.Join(sourceRoot, clean)
		targetPath := filepath.Join(targetRoot, clean)
		if _, err := os.Stat(sourcePath); err == nil {
			if _, err := os.Stat(targetPath); err != nil {
				report.add("media", fmt.Sprintf("missing target media %s", mediaPath), true)
			}
		} else if !os.IsNotExist(err) {
			report.add("media", fmt.Sprintf("%s media stat failed %s: %v", label, mediaPath, err), true)
		}
	}
}

func cleanMediaPath(path string) string {
	clean := filepath.ToSlash(filepath.Clean(path))
	clean = strings.TrimLeft(clean, "/")
	parts := strings.Split(clean, "/")
	safe := make([]string, 0, len(parts))
	for _, part := range parts {
		if part == "" || part == "." || part == ".." {
			continue
		}
		safe = append(safe, part)
	}
	if len(safe) == 0 {
		return ""
	}
	return filepath.Join(safe...)
}

func requireParent(report *Report, table string, rowID int, parentTable string, parentID int, parents map[int]bool) {
	if parentID == 0 {
		return
	}
	if !parents[parentID] {
		report.add("orphan", fmt.Sprintf("%s:%d missing %s:%d", table, rowID, parentTable, parentID), true)
	}
}

func idSet(rows []IDPair) map[int]bool {
	out := map[int]bool{}
	for _, row := range rows {
		out[row.TargetID] = true
	}
	return out
}

func idSetFromUsers(rows []UserRow) map[int]bool {
	out := map[int]bool{}
	for _, row := range rows {
		out[row.TargetID] = true
	}
	return out
}

func idSetFromMaps(rows []MapRow) map[int]bool {
	out := map[int]bool{}
	for _, row := range rows {
		out[row.TargetID] = true
	}
	return out
}

func idSetFromLineups(rows []LineupRow) map[int]bool {
	out := map[int]bool{}
	for _, row := range rows {
		out[row.TargetID] = true
	}
	return out
}

func idSetFromPullRequests(rows []PullRequestRow) map[int]bool {
	out := map[int]bool{}
	for _, row := range rows {
		out[row.TargetID] = true
	}
	return out
}

func userPairs(rows []UserRow) []IDPair {
	out := make([]IDPair, len(rows))
	for i, row := range rows {
		out[i] = IDPair{SourceID: row.SourceID, TargetID: row.TargetID}
	}
	return out
}

func mapPairs(rows []MapRow) []IDPair {
	out := make([]IDPair, len(rows))
	for i, row := range rows {
		out[i] = IDPair{SourceID: row.SourceID, TargetID: row.TargetID}
	}
	return out
}

func lineupPairs(rows []LineupRow) []IDPair {
	out := make([]IDPair, len(rows))
	for i, row := range rows {
		out[i] = IDPair{SourceID: row.SourceID, TargetID: row.TargetID}
	}
	return out
}

func pullRequestPairs(rows []PullRequestRow) []IDPair {
	out := make([]IDPair, len(rows))
	for i, row := range rows {
		out[i] = IDPair{SourceID: row.SourceID, TargetID: row.TargetID}
	}
	return out
}

func commentPairs(rows []CommentRow) []IDPair {
	out := make([]IDPair, len(rows))
	for i, row := range rows {
		out[i] = IDPair{SourceID: row.SourceID, TargetID: row.TargetID}
	}
	return out
}

func mapMedia(rows []MapRow) []string {
	var out []string
	for _, row := range rows {
		if row.ImagePath != nil && *row.ImagePath != "" {
			out = append(out, *row.ImagePath)
		}
	}
	return out
}

func lineupMedia(rows []LineupRow) []string {
	var out []string
	for _, row := range rows {
		if row.PreviewPath != nil && *row.PreviewPath != "" {
			out = append(out, *row.PreviewPath)
		}
	}
	return out
}
