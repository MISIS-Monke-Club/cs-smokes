package postgresrepo

import (
	"context"
	"errors"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/db/generated"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/favorites"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/lineups"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

func (s *Store) ListLineups(ctx context.Context, filter lineups.Filter) ([]lineups.Lineup, error) {
	rows, err := s.q.ListLineupsFiltered(ctx, generated.ListLineupsFilteredParams{
		IsApproved: boolFilter(filter.IsApproved),
		Query:      textFilter(filter.Query),
		ByUserName: textFilter(filter.ByUserName),
		Ordering:   filter.Ordering,
	})
	if err != nil {
		return nil, err
	}
	out := make([]lineups.Lineup, 0, len(rows))
	for _, row := range rows {
		item, err := s.lineupFromBase(ctx, lineupBase{
			GrenadeID: row.GrenadeID, MapID: row.MapID, UserID: row.UserID, GrenadeClassID: row.GrenadeClassID,
			LinkToVideo: row.LinkToVideo, Title: row.Title, Description: row.Description, IsApproved: row.IsApproved,
			Views: row.Views, PreviewImagePath: row.PreviewImagePath, CreatedAt: row.CreatedAt,
		})
		if err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	return out, nil
}

func (s *Store) CreateLineup(ctx context.Context, input lineups.Input) (lineups.Lineup, error) {
	if input.Title == "" {
		return lineups.Lineup{}, lineups.ValidationError{Fields: []string{"title"}}
	}
	row, err := s.q.CreateLineup(ctx, generated.CreateLineupParams{
		MapID:            int32(input.MapID),
		UserID:           int32(input.UserID),
		GrenadeClassID:   int32(input.GrenadeClassID),
		LinkToVideo:      textValue(input.LinkToVideo),
		Title:            input.Title,
		Description:      textValue(input.Description),
		IsApproved:       boolValue(input.IsApproved, false),
		Views:            int32(intValue(input.Views, 0)),
		PreviewImagePath: textValue(input.PreviewImagePath),
	})
	if err != nil {
		return lineups.Lineup{}, err
	}
	return s.lineupFromBase(ctx, lineupBaseFromCreate(row))
}

func (s *Store) GetLineup(ctx context.Context, id int) (lineups.Lineup, error) {
	row, err := s.q.GetLineupByID(ctx, int32(id))
	if err != nil {
		return lineups.Lineup{}, mapNotFound(err, lineups.ErrNotFound)
	}
	return s.lineupFromBase(ctx, lineupBaseFromGet(row))
}

func (s *Store) ReplaceLineup(ctx context.Context, id int, input lineups.Input) (lineups.Lineup, error) {
	return s.updateLineup(ctx, id, input, false)
}

func (s *Store) PatchLineup(ctx context.Context, id int, input lineups.Input) (lineups.Lineup, error) {
	return s.updateLineup(ctx, id, input, true)
}

func (s *Store) DeleteLineup(ctx context.Context, id int) error {
	if _, err := s.q.GetLineupByID(ctx, int32(id)); err != nil {
		return mapNotFound(err, lineups.ErrNotFound)
	}
	return s.q.DeleteLineup(ctx, int32(id))
}

func (s *Store) ChangeGrenadeClass(ctx context.Context, id int, classID int) (lineups.Lineup, error) {
	row, err := s.q.ChangeLineupGrenadeClass(ctx, generated.ChangeLineupGrenadeClassParams{
		GrenadeID:      int32(id),
		GrenadeClassID: int32(classID),
	})
	if err != nil {
		return lineups.Lineup{}, mapNotFound(err, lineups.ErrNotFound)
	}
	return s.lineupFromBase(ctx, lineupBaseFromChange(row))
}

func (s *Store) updateLineup(ctx context.Context, id int, input lineups.Input, merge bool) (lineups.Lineup, error) {
	if merge {
		current, err := s.q.GetLineupByID(ctx, int32(id))
		if err != nil {
			return lineups.Lineup{}, mapNotFound(err, lineups.ErrNotFound)
		}
		if input.MapID == 0 {
			input.MapID = int(current.MapID)
		}
		if input.UserID == 0 {
			input.UserID = int(current.UserID)
		}
		if input.GrenadeClassID == 0 {
			input.GrenadeClassID = int(current.GrenadeClassID)
		}
		if input.LinkToVideo == nil {
			input.LinkToVideo = textPtr(current.LinkToVideo)
		}
		if input.Title == "" {
			input.Title = current.Title
		}
		if input.Description == nil {
			input.Description = textPtr(current.Description)
		}
		if input.IsApproved == nil {
			value := current.IsApproved
			input.IsApproved = &value
		}
		if input.Views == nil {
			value := int(current.Views)
			input.Views = &value
		}
		if input.PreviewImagePath == nil {
			input.PreviewImagePath = textPtr(current.PreviewImagePath)
		}
	}
	row, err := s.q.UpdateLineup(ctx, generated.UpdateLineupParams{
		GrenadeID:        int32(id),
		MapID:            int32(input.MapID),
		UserID:           int32(input.UserID),
		GrenadeClassID:   int32(input.GrenadeClassID),
		LinkToVideo:      textValue(input.LinkToVideo),
		Title:            input.Title,
		Description:      textValue(input.Description),
		IsApproved:       boolValue(input.IsApproved, false),
		Views:            int32(intValue(input.Views, 0)),
		PreviewImagePath: textValue(input.PreviewImagePath),
	})
	if err != nil {
		return lineups.Lineup{}, mapNotFound(err, lineups.ErrNotFound)
	}
	return s.lineupFromBase(ctx, lineupBaseFromUpdate(row))
}

func (s *Store) CreateFavorite(ctx context.Context, userID int, grenadeID int) (favorites.FavoriteCreateResponse, error) {
	if err := s.q.CreateFavorite(ctx, generated.CreateFavoriteParams{UserID: int32(userID), GrenadeID: int32(grenadeID)}); err != nil {
		if isUniqueViolation(err) {
			return favorites.FavoriteCreateResponse{}, favorites.DuplicateError{}
		}
		return favorites.FavoriteCreateResponse{}, err
	}
	return favorites.FavoriteCreateResponse{UserID: userID, GrenadeID: grenadeID}, nil
}

func (s *Store) ListFavoritesByUser(ctx context.Context, userID int) ([]lineups.Lineup, error) {
	ids, err := s.q.ListFavoriteLineupIDsByUser(ctx, int32(userID))
	if err != nil {
		return nil, err
	}
	out := make([]lineups.Lineup, 0, len(ids))
	for _, id := range ids {
		item, err := s.GetLineup(ctx, int(id))
		if err != nil {
			return nil, err
		}
		item.IsFavorite = true
		out = append(out, item)
	}
	return out, nil
}

func (s *Store) DeleteFavorite(ctx context.Context, userID int, grenadeID int) error {
	return s.q.DeleteFavorite(ctx, generated.DeleteFavoriteParams{UserID: int32(userID), GrenadeID: int32(grenadeID)})
}

type lineupBase struct {
	GrenadeID        int32
	MapID            int32
	UserID           int32
	GrenadeClassID   int32
	LinkToVideo      pgtype.Text
	Title            string
	Description      pgtype.Text
	IsApproved       bool
	Views            int32
	PreviewImagePath pgtype.Text
	CreatedAt        pgtype.Timestamptz
}

func (s *Store) lineupFromBase(ctx context.Context, row lineupBase) (lineups.Lineup, error) {
	creator, err := s.GetUser(ctx, int(row.UserID))
	if err != nil {
		return lineups.Lineup{}, err
	}
	class, err := s.GetGrenadeClass(ctx, int(row.GrenadeClassID))
	if err != nil {
		return lineups.Lineup{}, err
	}
	propertyRows, err := s.q.ListLineupProperties(ctx, pgtype.Int4{Int32: row.GrenadeID, Valid: true})
	if err != nil {
		return lineups.Lineup{}, err
	}
	props := make([]lineups.PropertyInline, len(propertyRows))
	for i, prop := range propertyRows {
		props[i] = lineups.PropertyInline{PropertyID: int(prop.PropertyID), Name: prop.Name, Value: textPtr(prop.Value)}
	}
	var request lineups.RequestStatus
	if pr, err := s.q.GetPullRequestByLineupID(ctx, row.GrenadeID); err == nil {
		id := int(pr.ID)
		request = lineups.RequestStatus{RequestID: &id, Status: pr.Status}
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return lineups.Lineup{}, err
	}
	return lineups.Lineup{
		UserID:           int(row.UserID),
		GrenadeID:        int(row.GrenadeID),
		MapID:            int(row.MapID),
		LinkToVideo:      textPtr(row.LinkToVideo),
		Creator:          creator,
		CreatedAt:        timeString(row.CreatedAt),
		Title:            row.Title,
		Description:      textPtr(row.Description),
		IsApproved:       row.IsApproved,
		Views:            int(row.Views),
		PreviewImagePath: textPtr(row.PreviewImagePath),
		GrenadeClass:     class,
		PropertyList:     props,
		Request:          request,
	}, nil
}

func lineupBaseFromGet(row generated.GetLineupByIDRow) lineupBase {
	return lineupBase{GrenadeID: row.GrenadeID, MapID: row.MapID, UserID: row.UserID, GrenadeClassID: row.GrenadeClassID, LinkToVideo: row.LinkToVideo, Title: row.Title, Description: row.Description, IsApproved: row.IsApproved, Views: row.Views, PreviewImagePath: row.PreviewImagePath, CreatedAt: row.CreatedAt}
}

func lineupBaseFromCreate(row generated.CreateLineupRow) lineupBase {
	return lineupBase{GrenadeID: row.GrenadeID, MapID: row.MapID, UserID: row.UserID, GrenadeClassID: row.GrenadeClassID, LinkToVideo: row.LinkToVideo, Title: row.Title, Description: row.Description, IsApproved: row.IsApproved, Views: row.Views, PreviewImagePath: row.PreviewImagePath, CreatedAt: row.CreatedAt}
}

func lineupBaseFromUpdate(row generated.UpdateLineupRow) lineupBase {
	return lineupBase{GrenadeID: row.GrenadeID, MapID: row.MapID, UserID: row.UserID, GrenadeClassID: row.GrenadeClassID, LinkToVideo: row.LinkToVideo, Title: row.Title, Description: row.Description, IsApproved: row.IsApproved, Views: row.Views, PreviewImagePath: row.PreviewImagePath, CreatedAt: row.CreatedAt}
}

func lineupBaseFromChange(row generated.ChangeLineupGrenadeClassRow) lineupBase {
	return lineupBase{GrenadeID: row.GrenadeID, MapID: row.MapID, UserID: row.UserID, GrenadeClassID: row.GrenadeClassID, LinkToVideo: row.LinkToVideo, Title: row.Title, Description: row.Description, IsApproved: row.IsApproved, Views: row.Views, PreviewImagePath: row.PreviewImagePath, CreatedAt: row.CreatedAt}
}
