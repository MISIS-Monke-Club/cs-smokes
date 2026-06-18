package postgresrepo

import (
	"context"
	"crypto/pbkdf2"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/auth"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/db/generated"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/favorites"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/grenadeclasses"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/lineups"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/maps"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/platform/httpserver"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/properties"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/pullrequests"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/realtime"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/users"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
)

type Store struct {
	q *generated.Queries
}

func New(db generated.DBTX) *Store {
	return &Store{q: generated.New(db)}
}

func (s *Store) Repositories() httpserver.Repositories {
	return httpserver.Repositories{
		Auth:           s,
		Users:          s,
		GrenadeClasses: s,
		Maps:           s,
		Lineups:        s,
		Properties:     s,
		Favorites:      s,
		PullRequests:   PullRequests{store: s},
		Realtime:       Realtime{store: s},
	}
}

func (s *Store) ListUsers(ctx context.Context) ([]users.User, error) {
	rows, err := s.q.ListUsers(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]users.User, len(rows))
	for i, row := range rows {
		out[i] = userFromList(row)
	}
	return out, nil
}

func (s *Store) CreateUser(ctx context.Context, input users.UserInput) (users.User, error) {
	passwordHash, err := optionalPasswordHash(input.Password)
	if err != nil {
		return users.User{}, err
	}
	row, err := s.q.CreateUser(ctx, generated.CreateUserParams{
		Username:     input.Username,
		Email:        textValue(input.Email),
		PasswordHash: textValue(passwordHash),
		FirstName:    textValue(input.FirstName),
		LastName:     textValue(input.LastName),
		AvatarUrl:    textValue(input.AvatarURL),
		SteamLink:    textValue(input.SteamLink),
		TgID:         pgtype.Int8{},
	})
	if err != nil {
		return users.User{}, mapUserWriteError(err)
	}
	return userFromCreate(row), nil
}

func (s *Store) GetUser(ctx context.Context, id int) (users.User, error) {
	row, err := s.q.GetUserByID(ctx, int32(id))
	if err != nil {
		return users.User{}, mapNotFound(err, users.ErrNotFound)
	}
	return userFromGet(row), nil
}

func (s *Store) ReplaceUser(ctx context.Context, id int, input users.UserInput) (users.User, error) {
	return s.updateUser(ctx, id, input, false)
}

func (s *Store) PatchUser(ctx context.Context, id int, input users.UserInput) (users.User, error) {
	return s.updateUser(ctx, id, input, true)
}

func (s *Store) DeleteUser(ctx context.Context, id int) error {
	if _, err := s.q.GetUserByID(ctx, int32(id)); err != nil {
		return mapNotFound(err, users.ErrNotFound)
	}
	return s.q.DeleteUser(ctx, int32(id))
}

func (s *Store) updateUser(ctx context.Context, id int, input users.UserInput, merge bool) (users.User, error) {
	current, err := s.q.FindUserByUsernameOrEmail(ctx, input.Username)
	if err == nil && int(current.UserID) != id {
		return users.User{}, users.DuplicateError{Fields: []string{"username"}}
	}
	existing, err := s.q.GetUserByID(ctx, int32(id))
	if err != nil {
		return users.User{}, mapNotFound(err, users.ErrNotFound)
	}
	username := input.Username
	email := input.Email
	firstName := input.FirstName
	lastName := input.LastName
	avatarURL := input.AvatarURL
	steamLink := input.SteamLink
	passwordHash := textPtr(existing.PasswordHash)
	if merge {
		if username == "" {
			username = existing.Username
		}
		if email == nil {
			email = textPtr(existing.Email)
		}
		if firstName == nil {
			firstName = textPtr(existing.FirstName)
		}
		if lastName == nil {
			lastName = textPtr(existing.LastName)
		}
		if avatarURL == nil {
			avatarURL = textPtr(existing.AvatarUrl)
		}
		if steamLink == nil {
			steamLink = textPtr(existing.SteamLink)
		}
	}
	if input.Password != "" {
		passwordHash, err = hashPassword(input.Password)
		if err != nil {
			return users.User{}, err
		}
	}
	row, err := s.q.UpdateUser(ctx, generated.UpdateUserParams{
		UserID:       int32(id),
		Username:     username,
		Email:        textValue(email),
		PasswordHash: textValue(passwordHash),
		FirstName:    textValue(firstName),
		LastName:     textValue(lastName),
		AvatarUrl:    textValue(avatarURL),
		SteamLink:    textValue(steamLink),
	})
	if err != nil {
		return users.User{}, mapUserWriteError(err)
	}
	return userFromUpdate(row), nil
}

func (s *Store) FindByTelegramID(ctx context.Context, tgID int64) (auth.UserRecord, error) {
	row, err := s.q.FindUserByTelegramID(ctx, pgtype.Int8{Int64: tgID, Valid: true})
	if err != nil {
		return auth.UserRecord{}, mapNotFound(err, auth.ErrUserNotFound)
	}
	return authUserFromTelegram(row), nil
}

func (s *Store) CreateTelegramUser(ctx context.Context, user auth.TelegramUser) (auth.UserRecord, error) {
	username := user.Username
	if username == "" {
		username = fmt.Sprintf("tg_%d", user.ID)
	}
	row, err := s.q.CreateUser(ctx, generated.CreateUserParams{
		Username:  username,
		FirstName: textValue(emptyStringNil(user.FirstName)),
		LastName:  textValue(emptyStringNil(user.LastName)),
		AvatarUrl: textValue(emptyStringNil(user.PhotoURL)),
		TgID:      pgtype.Int8{Int64: user.ID, Valid: true},
	})
	if err != nil {
		return auth.UserRecord{}, err
	}
	return authUserFromCreate(row), nil
}

func (s *Store) FindByUsernameOrEmail(ctx context.Context, value string) (auth.UserRecord, error) {
	row, err := s.q.FindUserByUsernameOrEmail(ctx, value)
	if err != nil {
		return auth.UserRecord{}, mapNotFound(err, auth.ErrUserNotFound)
	}
	return authUserFromUsername(row), nil
}

func (s *Store) CreatePasswordUser(ctx context.Context, input auth.RegisterInput) (auth.UserRecord, error) {
	passwordHash, err := hashPassword(input.Password)
	if err != nil {
		return auth.UserRecord{}, err
	}
	row, err := s.q.CreateUser(ctx, generated.CreateUserParams{
		Username:     input.Username,
		Email:        textValue(&input.Email),
		PasswordHash: textValue(passwordHash),
	})
	if err != nil {
		return auth.UserRecord{}, err
	}
	return authUserFromCreate(row), nil
}

func (s *Store) RolesForUser(ctx context.Context, userID int) (auth.RoleSet, error) {
	codes, err := s.q.ListUserRoleCodes(ctx, int32(userID))
	if err != nil {
		return auth.RoleSet{}, err
	}
	var roles auth.RoleSet
	for _, code := range codes {
		switch code {
		case "superuser":
			roles.IsSuperuser = true
		case "base_admin":
			roles.IsBaseAdmin = true
		case "editor":
			roles.IsEditor = true
		}
	}
	return roles, nil
}

func (s *Store) ListGrenadeClasses(ctx context.Context) ([]grenadeclasses.GrenadeClass, error) {
	rows, err := s.q.ListGrenadeClasses(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]grenadeclasses.GrenadeClass, len(rows))
	for i, row := range rows {
		out[i] = classFromList(row)
	}
	return out, nil
}

func (s *Store) CreateGrenadeClass(ctx context.Context, input grenadeclasses.Input) (grenadeclasses.GrenadeClass, error) {
	row, err := s.q.CreateGrenadeClass(ctx, generated.CreateGrenadeClassParams{
		Name:        input.Name,
		Description: textValue(input.Description),
		Price:       int32(input.Price),
	})
	if err != nil {
		return grenadeclasses.GrenadeClass{}, err
	}
	return classFromRecord(row), nil
}

func (s *Store) GetGrenadeClass(ctx context.Context, id int) (grenadeclasses.GrenadeClass, error) {
	row, err := s.q.GetGrenadeClassByID(ctx, int32(id))
	if err != nil {
		return grenadeclasses.GrenadeClass{}, mapNotFound(err, grenadeclasses.ErrNotFound)
	}
	return classFromGet(row), nil
}

func (s *Store) ReplaceGrenadeClass(ctx context.Context, id int, input grenadeclasses.Input) (grenadeclasses.GrenadeClass, error) {
	return s.updateGrenadeClass(ctx, id, input, false)
}

func (s *Store) PatchGrenadeClass(ctx context.Context, id int, input grenadeclasses.Input) (grenadeclasses.GrenadeClass, error) {
	return s.updateGrenadeClass(ctx, id, input, true)
}

func (s *Store) DeleteGrenadeClass(ctx context.Context, id int) error {
	if _, err := s.q.GetGrenadeClassByID(ctx, int32(id)); err != nil {
		return mapNotFound(err, grenadeclasses.ErrNotFound)
	}
	return s.q.DeleteGrenadeClass(ctx, int32(id))
}

func (s *Store) updateGrenadeClass(ctx context.Context, id int, input grenadeclasses.Input, merge bool) (grenadeclasses.GrenadeClass, error) {
	if merge {
		current, err := s.q.GetGrenadeClassByID(ctx, int32(id))
		if err != nil {
			return grenadeclasses.GrenadeClass{}, mapNotFound(err, grenadeclasses.ErrNotFound)
		}
		if input.Name == "" {
			input.Name = current.Name
		}
		if input.Description == nil {
			input.Description = textPtr(current.Description)
		}
		if input.Price == 0 {
			input.Price = int(current.Price)
		}
	}
	row, err := s.q.UpdateGrenadeClass(ctx, generated.UpdateGrenadeClassParams{
		GrenadeClassID: int32(id),
		Name:           input.Name,
		Description:    textValue(input.Description),
		Price:          int32(input.Price),
	})
	if err != nil {
		return grenadeclasses.GrenadeClass{}, mapNotFound(err, grenadeclasses.ErrNotFound)
	}
	return classFromUpdate(row), nil
}

func (s *Store) ListMaps(ctx context.Context, filter maps.Filter) ([]maps.Map, error) {
	rows, err := s.q.ListMaps(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]maps.Map, 0, len(rows))
	for _, row := range rows {
		item := mapFromList(row)
		if filter.IsEsportsPool != nil && item.IsEsportsPool != *filter.IsEsportsPool {
			continue
		}
		if filter.Query != "" && !strings.Contains(strings.ToLower(item.Name), strings.ToLower(filter.Query)) {
			continue
		}
		out = append(out, item)
	}
	sortMaps(out, filter.Ordering)
	return out, nil
}

func (s *Store) CreateMap(ctx context.Context, input maps.Input) (maps.Map, error) {
	if input.Name == "" {
		return maps.Map{}, maps.ValidationError{Fields: []string{"name"}}
	}
	row, err := s.q.CreateMap(ctx, generated.CreateMapParams{
		Name:          input.Name,
		Link:          textValue(input.Link),
		IsEsportsPool: input.IsEsportsPool,
		ImagePath:     textValue(input.ImagePath),
	})
	if err != nil {
		return maps.Map{}, err
	}
	return mapFromRecord(row), nil
}

func (s *Store) GetMap(ctx context.Context, id int) (maps.Map, error) {
	row, err := s.q.GetMapByID(ctx, int32(id))
	if err != nil {
		return maps.Map{}, mapNotFound(err, maps.ErrNotFound)
	}
	return mapFromGet(row), nil
}

func (s *Store) ReplaceMap(ctx context.Context, id int, input maps.Input) (maps.Map, error) {
	return s.updateMap(ctx, id, input, false)
}

func (s *Store) PatchMap(ctx context.Context, id int, input maps.Input) (maps.Map, error) {
	return s.updateMap(ctx, id, input, true)
}

func (s *Store) DeleteMap(ctx context.Context, id int) error {
	if _, err := s.q.GetMapByID(ctx, int32(id)); err != nil {
		return mapNotFound(err, maps.ErrNotFound)
	}
	return s.q.DeleteMap(ctx, int32(id))
}

func (s *Store) updateMap(ctx context.Context, id int, input maps.Input, merge bool) (maps.Map, error) {
	if merge {
		current, err := s.q.GetMapByID(ctx, int32(id))
		if err != nil {
			return maps.Map{}, mapNotFound(err, maps.ErrNotFound)
		}
		if input.Name == "" {
			input.Name = current.Name
		}
		if input.Link == nil {
			input.Link = textPtr(current.Link)
		}
		if input.ImagePath == nil {
			input.ImagePath = textPtr(current.ImagePath)
		}
	}
	row, err := s.q.UpdateMap(ctx, generated.UpdateMapParams{
		MapID:         int32(id),
		Name:          input.Name,
		Link:          textValue(input.Link),
		IsEsportsPool: input.IsEsportsPool,
		ImagePath:     textValue(input.ImagePath),
	})
	if err != nil {
		return maps.Map{}, mapNotFound(err, maps.ErrNotFound)
	}
	return mapFromUpdate(row), nil
}

func (s *Store) ListLineups(ctx context.Context, filter lineups.Filter) ([]lineups.Lineup, error) {
	rows, err := s.q.ListLineups(ctx)
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
		if filter.IsApproved != nil && item.IsApproved != *filter.IsApproved {
			continue
		}
		if filter.Query != "" && !strings.Contains(strings.ToLower(item.Title), strings.ToLower(filter.Query)) {
			continue
		}
		if filter.ByUserName != "" && !strings.Contains(strings.ToLower(item.Creator.Username), strings.ToLower(filter.ByUserName)) {
			continue
		}
		out = append(out, item)
	}
	sortLineups(out, filter.Ordering)
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
		IsApproved:       input.IsApproved,
		Views:            int32(input.Views),
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
		if input.Views == 0 {
			input.Views = int(current.Views)
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
		IsApproved:       input.IsApproved,
		Views:            int32(input.Views),
		PreviewImagePath: textValue(input.PreviewImagePath),
	})
	if err != nil {
		return lineups.Lineup{}, mapNotFound(err, lineups.ErrNotFound)
	}
	return s.lineupFromBase(ctx, lineupBaseFromUpdate(row))
}

func (s *Store) ListProperties(ctx context.Context) ([]properties.Property, error) {
	rows, err := s.q.ListProperties(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]properties.Property, len(rows))
	for i, row := range rows {
		out[i] = propertyFromList(row)
	}
	return out, nil
}

func (s *Store) CreateProperty(ctx context.Context, input properties.Input) (properties.Property, error) {
	row, err := s.q.CreateProperty(ctx, generated.CreatePropertyParams{Name: input.Name, Value: textValue(input.Value)})
	if err != nil {
		return properties.Property{}, err
	}
	return propertyFromRecord(row), nil
}

func (s *Store) GetProperty(ctx context.Context, id int) (properties.Property, error) {
	row, err := s.q.GetPropertyByID(ctx, int32(id))
	if err != nil {
		return properties.Property{}, mapNotFound(err, properties.ErrNotFound)
	}
	return propertyFromGet(row), nil
}

func (s *Store) ReplaceProperty(ctx context.Context, id int, input properties.Input) (properties.Property, error) {
	return s.updateProperty(ctx, id, input, false)
}

func (s *Store) PatchProperty(ctx context.Context, id int, input properties.Input) (properties.Property, error) {
	return s.updateProperty(ctx, id, input, true)
}

func (s *Store) DeleteProperty(ctx context.Context, id int) error {
	if _, err := s.q.GetPropertyByID(ctx, int32(id)); err != nil {
		return mapNotFound(err, properties.ErrNotFound)
	}
	return s.q.DeleteProperty(ctx, int32(id))
}

func (s *Store) ListPropertyRelations(ctx context.Context, grenadeID *int) ([]properties.PropertyRelation, error) {
	rows, err := s.q.ListLineupProperties(ctx, int4Value(grenadeID))
	if err != nil {
		return nil, err
	}
	out := make([]properties.PropertyRelation, len(rows))
	for i, row := range rows {
		out[i] = propertyRelationFromList(row)
	}
	return out, nil
}

func (s *Store) CreateLineupProperty(ctx context.Context, grenadeID int, propertyID int) (properties.PropertyRelation, error) {
	err := s.q.CreateLineupProperty(ctx, generated.CreateLineupPropertyParams{PropertyID: int32(propertyID), GrenadeID: int32(grenadeID)})
	if err != nil {
		if isUniqueViolation(err) {
			return properties.PropertyRelation{}, properties.DuplicateError{}
		}
		return properties.PropertyRelation{}, err
	}
	rows, err := s.q.ListLineupProperties(ctx, pgtype.Int4{Int32: int32(grenadeID), Valid: true})
	if err != nil {
		return properties.PropertyRelation{}, err
	}
	for _, row := range rows {
		if int(row.PropertyID) == propertyID {
			return propertyRelationFromList(row), nil
		}
	}
	return properties.PropertyRelation{}, properties.ErrNotFound
}

func (s *Store) DeleteLineupProperty(ctx context.Context, grenadeID int, propertyID int) error {
	return s.q.DeleteLineupProperty(ctx, generated.DeleteLineupPropertyParams{PropertyID: int32(propertyID), GrenadeID: int32(grenadeID)})
}

func (s *Store) updateProperty(ctx context.Context, id int, input properties.Input, merge bool) (properties.Property, error) {
	if merge {
		current, err := s.q.GetPropertyByID(ctx, int32(id))
		if err != nil {
			return properties.Property{}, mapNotFound(err, properties.ErrNotFound)
		}
		if input.Name == "" {
			input.Name = current.Name
		}
		if input.Value == nil {
			input.Value = textPtr(current.Value)
		}
	}
	row, err := s.q.UpdateProperty(ctx, generated.UpdatePropertyParams{PropertyID: int32(id), Name: input.Name, Value: textValue(input.Value)})
	if err != nil {
		return properties.Property{}, mapNotFound(err, properties.ErrNotFound)
	}
	return propertyFromUpdate(row), nil
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

type PullRequests struct {
	store *Store
}

func (r PullRequests) ListPullRequests(ctx context.Context) ([]pullrequests.PullRequest, error) {
	rows, err := r.store.q.ListPullRequests(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]pullrequests.PullRequest, 0, len(rows))
	for _, row := range rows {
		item, err := r.store.pullRequestFromRecord(ctx, row)
		if err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	return out, nil
}

func (r PullRequests) CreatePullRequest(ctx context.Context, actor pullrequests.Actor, lineupID int) (pullrequests.PullRequest, error) {
	row, err := r.store.q.CreatePullRequest(ctx, generated.CreatePullRequestParams{LineupID: int32(lineupID), CreatorID: int32(actor.UserID)})
	if err != nil {
		return pullrequests.PullRequest{}, err
	}
	return r.store.pullRequestFromRecord(ctx, row)
}

func (r PullRequests) GetPullRequest(ctx context.Context, id int) (pullrequests.PullRequest, error) {
	row, err := r.store.q.GetPullRequestByID(ctx, int32(id))
	if err != nil {
		return pullrequests.PullRequest{}, mapNotFound(err, pullrequests.ErrNotFound)
	}
	return r.store.pullRequestFromRecord(ctx, row)
}

func (r PullRequests) UpdatePullRequestStatus(ctx context.Context, id int, status string, approverID *int) (pullrequests.PullRequest, error) {
	row, err := r.store.q.UpdatePullRequestStatus(ctx, generated.UpdatePullRequestStatusParams{
		ID:         int32(id),
		Status:     status,
		ApproverID: int4Value(approverID),
	})
	if err != nil {
		return pullrequests.PullRequest{}, mapNotFound(err, pullrequests.ErrNotFound)
	}
	return r.store.pullRequestFromRecord(ctx, row)
}

func (r PullRequests) DeletePullRequest(ctx context.Context, id int) error {
	if _, err := r.store.q.GetPullRequestByID(ctx, int32(id)); err != nil {
		return mapNotFound(err, pullrequests.ErrNotFound)
	}
	return r.store.q.DeletePullRequest(ctx, int32(id))
}

func (r PullRequests) ListComments(ctx context.Context, prID int) ([]pullrequests.Comment, error) {
	return r.store.commentsByPullRequest(ctx, prID)
}

func (r PullRequests) CreateComment(ctx context.Context, prID int, actor pullrequests.Actor, text string) (pullrequests.Comment, error) {
	row, err := r.store.q.CreateComment(ctx, generated.CreateCommentParams{PullRequestID: int32(prID), AuthorID: int32(actor.UserID), Text: text})
	if err != nil {
		return pullrequests.Comment{}, err
	}
	return r.store.commentFromRecord(ctx, row)
}

func (r PullRequests) GetComment(ctx context.Context, id int) (pullrequests.Comment, error) {
	row, err := r.store.q.GetCommentByID(ctx, int32(id))
	if err != nil {
		return pullrequests.Comment{}, mapNotFound(err, pullrequests.ErrNotFound)
	}
	return r.store.commentFromRecord(ctx, row)
}

func (r PullRequests) UpdateComment(ctx context.Context, id int, text string) (pullrequests.Comment, error) {
	row, err := r.store.q.UpdateComment(ctx, generated.UpdateCommentParams{ID: int32(id), Text: text})
	if err != nil {
		return pullrequests.Comment{}, mapNotFound(err, pullrequests.ErrNotFound)
	}
	return r.store.commentFromRecord(ctx, row)
}

func (r PullRequests) DeleteComment(ctx context.Context, id int) error {
	if _, err := r.store.q.GetCommentByID(ctx, int32(id)); err != nil {
		return mapNotFound(err, pullrequests.ErrNotFound)
	}
	return r.store.q.DeleteComment(ctx, int32(id))
}

type Realtime struct {
	store *Store
}

func (r Realtime) ListComments(ctx context.Context, prID int) ([]pullrequests.Comment, error) {
	return r.store.commentsByPullRequest(ctx, prID)
}

func (r Realtime) CreateComment(ctx context.Context, prID int, actor pullrequests.Actor, text string) (pullrequests.Comment, error) {
	return PullRequests{store: r.store}.CreateComment(ctx, prID, actor, text)
}

func (r Realtime) DeleteComment(ctx context.Context, commentID int, actor pullrequests.Actor) ([]pullrequests.Comment, error) {
	comment, err := PullRequests{store: r.store}.GetComment(ctx, commentID)
	if err != nil {
		return nil, err
	}
	if comment.Creator.UserID != actor.UserID && !actor.IsSuperuser && !actor.IsBaseAdmin && !actor.IsEditor {
		return nil, pullrequests.ErrNotFound
	}
	if err := r.store.q.DeleteComment(ctx, int32(commentID)); err != nil {
		return nil, err
	}
	return r.store.commentsByPullRequest(ctx, comment.PullRequestID)
}

func (s *Store) pullRequestFromRecord(ctx context.Context, row generated.PullRequest) (pullrequests.PullRequest, error) {
	lineup, err := s.GetLineup(ctx, int(row.LineupID))
	if err != nil {
		return pullrequests.PullRequest{}, err
	}
	creator, err := s.GetUser(ctx, int(row.CreatorID))
	if err != nil {
		return pullrequests.PullRequest{}, err
	}
	var approver *users.User
	if row.ApproverID.Valid {
		user, err := s.GetUser(ctx, int(row.ApproverID.Int32))
		if err != nil {
			return pullrequests.PullRequest{}, err
		}
		approver = &user
	}
	return pullrequests.PullRequest{
		ID:        int(row.ID),
		LineupID:  int(row.LineupID),
		Lineup:    lineup,
		Creator:   creator,
		Approver:  approver,
		Status:    row.Status,
		CreatedAt: timeString(row.CreatedAt),
		ClosedAt:  timePtrString(row.ClosedAt),
	}, nil
}

func (s *Store) commentsByPullRequest(ctx context.Context, prID int) ([]pullrequests.Comment, error) {
	rows, err := s.q.ListCommentsByPullRequest(ctx, int32(prID))
	if err != nil {
		return nil, err
	}
	out := make([]pullrequests.Comment, 0, len(rows))
	for _, row := range rows {
		item, err := s.commentFromRecord(ctx, row)
		if err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	return out, nil
}

func (s *Store) commentFromRecord(ctx context.Context, row generated.Comment) (pullrequests.Comment, error) {
	creator, err := s.GetUser(ctx, int(row.AuthorID))
	if err != nil {
		return pullrequests.Comment{}, err
	}
	return pullrequests.Comment{
		ID:            int(row.ID),
		PullRequestID: int(row.PullRequestID),
		Text:          row.Text,
		Creator:       creator,
		CreatorRole:   roleForUser(ctx, s, int(row.AuthorID)),
		CreatedAt:     timeString(row.CreatedAt),
	}, nil
}

func roleForUser(ctx context.Context, s *Store, userID int) string {
	roles, err := s.RolesForUser(ctx, userID)
	if err != nil {
		return "user"
	}
	switch {
	case roles.IsSuperuser:
		return "superuser"
	case roles.IsBaseAdmin:
		return "base_admin"
	case roles.IsEditor:
		return "editor"
	default:
		return "user"
	}
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

func mapNotFound(err error, target error) error {
	if errors.Is(err, pgx.ErrNoRows) {
		return target
	}
	return err
}

func mapUserWriteError(err error) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		fields := []string{}
		switch pgErr.ConstraintName {
		case "users_username_key":
			fields = append(fields, "username")
		case "users_email_key":
			fields = append(fields, "email")
		default:
			fields = append(fields, "username", "email")
		}
		return users.DuplicateError{Fields: fields}
	}
	return err
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

func optionalPasswordHash(password string) (*string, error) {
	if password == "" {
		return nil, nil
	}
	return hashPassword(password)
}

func hashPassword(password string) (*string, error) {
	saltBytes := make([]byte, 12)
	if _, err := rand.Read(saltBytes); err != nil {
		return nil, err
	}
	salt := base64.RawStdEncoding.EncodeToString(saltBytes)
	iterations := 260000
	digest, err := pbkdf2.Key(sha256.New, password, []byte(salt), iterations, sha256.Size)
	if err != nil {
		return nil, err
	}
	encoded := fmt.Sprintf("pbkdf2_sha256$%d$%s$%s", iterations, salt, base64.StdEncoding.EncodeToString(digest))
	return &encoded, nil
}

func textPtr(value pgtype.Text) *string {
	if !value.Valid {
		return nil
	}
	out := value.String
	return &out
}

func textValue(value *string) pgtype.Text {
	if value == nil {
		return pgtype.Text{}
	}
	return pgtype.Text{String: *value, Valid: true}
}

func int64Ptr(value pgtype.Int8) *int64 {
	if !value.Valid {
		return nil
	}
	out := value.Int64
	return &out
}

func int4Value(value *int) pgtype.Int4 {
	if value == nil {
		return pgtype.Int4{}
	}
	return pgtype.Int4{Int32: int32(*value), Valid: true}
}

func timeString(value pgtype.Timestamptz) string {
	if !value.Valid {
		return ""
	}
	return value.Time.Format(time.RFC3339Nano)
}

func timePtrString(value pgtype.Timestamptz) *string {
	if !value.Valid {
		return nil
	}
	out := timeString(value)
	return &out
}

func emptyStringNil(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}

func userFromList(row generated.ListUsersRow) users.User {
	return users.User{
		UserID:    int(row.UserID),
		Username:  row.Username,
		Email:     textPtr(row.Email),
		FirstName: textPtr(row.FirstName),
		LastName:  textPtr(row.LastName),
		AvatarURL: textPtr(row.AvatarUrl),
		SteamLink: textPtr(row.SteamLink),
		TgID:      int64Ptr(row.TgID),
		IsBanned:  row.IsBanned,
	}
}

func userFromGet(row generated.GetUserByIDRow) users.User {
	return users.User{
		UserID:    int(row.UserID),
		Username:  row.Username,
		Email:     textPtr(row.Email),
		FirstName: textPtr(row.FirstName),
		LastName:  textPtr(row.LastName),
		AvatarURL: textPtr(row.AvatarUrl),
		SteamLink: textPtr(row.SteamLink),
		TgID:      int64Ptr(row.TgID),
		IsBanned:  row.IsBanned,
	}
}

func userFromCreate(row generated.CreateUserRow) users.User {
	return users.User{
		UserID:    int(row.UserID),
		Username:  row.Username,
		Email:     textPtr(row.Email),
		FirstName: textPtr(row.FirstName),
		LastName:  textPtr(row.LastName),
		AvatarURL: textPtr(row.AvatarUrl),
		SteamLink: textPtr(row.SteamLink),
		TgID:      int64Ptr(row.TgID),
		IsBanned:  row.IsBanned,
	}
}

func userFromUpdate(row generated.UpdateUserRow) users.User {
	return users.User{
		UserID:    int(row.UserID),
		Username:  row.Username,
		Email:     textPtr(row.Email),
		FirstName: textPtr(row.FirstName),
		LastName:  textPtr(row.LastName),
		AvatarURL: textPtr(row.AvatarUrl),
		SteamLink: textPtr(row.SteamLink),
		TgID:      int64Ptr(row.TgID),
		IsBanned:  row.IsBanned,
	}
}

func authUserFromCreate(row generated.CreateUserRow) auth.UserRecord {
	return auth.UserRecord{
		UserID:       int(row.UserID),
		Username:     row.Username,
		Email:        stringValue(row.Email),
		PasswordHash: stringValue(row.PasswordHash),
		FirstName:    stringValue(row.FirstName),
		LastName:     stringValue(row.LastName),
		AvatarURL:    stringValue(row.AvatarUrl),
		SteamLink:    stringValue(row.SteamLink),
		TelegramID:   int64Value(row.TgID),
		IsBanned:     row.IsBanned,
	}
}

func authUserFromTelegram(row generated.FindUserByTelegramIDRow) auth.UserRecord {
	return auth.UserRecord{
		UserID:       int(row.UserID),
		Username:     row.Username,
		Email:        stringValue(row.Email),
		PasswordHash: stringValue(row.PasswordHash),
		FirstName:    stringValue(row.FirstName),
		LastName:     stringValue(row.LastName),
		AvatarURL:    stringValue(row.AvatarUrl),
		SteamLink:    stringValue(row.SteamLink),
		TelegramID:   int64Value(row.TgID),
		IsBanned:     row.IsBanned,
	}
}

func authUserFromUsername(row generated.FindUserByUsernameOrEmailRow) auth.UserRecord {
	return auth.UserRecord{
		UserID:       int(row.UserID),
		Username:     row.Username,
		Email:        stringValue(row.Email),
		PasswordHash: stringValue(row.PasswordHash),
		FirstName:    stringValue(row.FirstName),
		LastName:     stringValue(row.LastName),
		AvatarURL:    stringValue(row.AvatarUrl),
		SteamLink:    stringValue(row.SteamLink),
		TelegramID:   int64Value(row.TgID),
		IsBanned:     row.IsBanned,
	}
}

func stringValue(value pgtype.Text) string {
	if !value.Valid {
		return ""
	}
	return value.String
}

func int64Value(value pgtype.Int8) int64 {
	if !value.Valid {
		return 0
	}
	return value.Int64
}

func classFromList(row generated.ListGrenadeClassesRow) grenadeclasses.GrenadeClass {
	return grenadeclasses.GrenadeClass{GrenadeClassID: int(row.GrenadeClassID), Name: row.Name, Description: textPtr(row.Description), Price: int(row.Price)}
}

func classFromGet(row generated.GetGrenadeClassByIDRow) grenadeclasses.GrenadeClass {
	return grenadeclasses.GrenadeClass{GrenadeClassID: int(row.GrenadeClassID), Name: row.Name, Description: textPtr(row.Description), Price: int(row.Price)}
}

func classFromRecord(row generated.CreateGrenadeClassRow) grenadeclasses.GrenadeClass {
	return grenadeclasses.GrenadeClass{GrenadeClassID: int(row.GrenadeClassID), Name: row.Name, Description: textPtr(row.Description), Price: int(row.Price)}
}

func classFromUpdate(row generated.UpdateGrenadeClassRow) grenadeclasses.GrenadeClass {
	return grenadeclasses.GrenadeClass{GrenadeClassID: int(row.GrenadeClassID), Name: row.Name, Description: textPtr(row.Description), Price: int(row.Price)}
}

func mapFromList(row generated.ListMapsRow) maps.Map {
	return maps.Map{MapID: int(row.MapID), Name: row.Name, Link: textPtr(row.Link), IsEsportsPool: row.IsEsportsPool, ImagePath: textPtr(row.ImagePath)}
}

func mapFromGet(row generated.GetMapByIDRow) maps.Map {
	return maps.Map{MapID: int(row.MapID), Name: row.Name, Link: textPtr(row.Link), IsEsportsPool: row.IsEsportsPool, ImagePath: textPtr(row.ImagePath)}
}

func mapFromRecord(row generated.CreateMapRow) maps.Map {
	return maps.Map{MapID: int(row.MapID), Name: row.Name, Link: textPtr(row.Link), IsEsportsPool: row.IsEsportsPool, ImagePath: textPtr(row.ImagePath)}
}

func mapFromUpdate(row generated.UpdateMapRow) maps.Map {
	return maps.Map{MapID: int(row.MapID), Name: row.Name, Link: textPtr(row.Link), IsEsportsPool: row.IsEsportsPool, ImagePath: textPtr(row.ImagePath)}
}

func propertyFromList(row generated.ListPropertiesRow) properties.Property {
	return properties.Property{PropertyID: int(row.PropertyID), Name: row.Name, Value: textPtr(row.Value)}
}

func propertyFromGet(row generated.GetPropertyByIDRow) properties.Property {
	return properties.Property{PropertyID: int(row.PropertyID), Name: row.Name, Value: textPtr(row.Value)}
}

func propertyFromRecord(row generated.CreatePropertyRow) properties.Property {
	return properties.Property{PropertyID: int(row.PropertyID), Name: row.Name, Value: textPtr(row.Value)}
}

func propertyFromUpdate(row generated.UpdatePropertyRow) properties.Property {
	return properties.Property{PropertyID: int(row.PropertyID), Name: row.Name, Value: textPtr(row.Value)}
}

func propertyRelationFromList(row generated.ListLineupPropertiesRow) properties.PropertyRelation {
	return properties.PropertyRelation{PropertyID: int(row.PropertyID), GrenadeID: int(row.GrenadeID), Name: row.Name, Value: textPtr(row.Value)}
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

func sortMaps(items []maps.Map, ordering string) {
	switch ordering {
	case "by_alphabet":
		sort.Slice(items, func(i, j int) bool { return items[i].Name < items[j].Name })
	case "-by_alphabet":
		sort.Slice(items, func(i, j int) bool { return items[i].Name > items[j].Name })
	}
}

func sortLineups(items []lineups.Lineup, ordering string) {
	switch ordering {
	case "by_alphabet":
		sort.Slice(items, func(i, j int) bool { return items[i].Title < items[j].Title })
	case "-by_alphabet":
		sort.Slice(items, func(i, j int) bool { return items[i].Title > items[j].Title })
	case "-date_of_creation":
		sort.Slice(items, func(i, j int) bool { return items[i].CreatedAt > items[j].CreatedAt })
	case "date_of_creation":
		sort.Slice(items, func(i, j int) bool { return items[i].CreatedAt < items[j].CreatedAt })
	}
}

var _ auth.UserRepository = (*Store)(nil)
var _ users.Repository = (*Store)(nil)
var _ grenadeclasses.Repository = (*Store)(nil)
var _ maps.Repository = (*Store)(nil)
var _ lineups.Repository = (*Store)(nil)
var _ properties.Repository = (*Store)(nil)
var _ favorites.Repository = (*Store)(nil)
var _ pullrequests.Repository = PullRequests{}
var _ realtime.Repository = Realtime{}
