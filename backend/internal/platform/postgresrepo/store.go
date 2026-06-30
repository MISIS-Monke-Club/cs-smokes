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
		AdminRoles:     s,
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
		Price:       int32(intValue(input.Price, 0)),
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
		if input.Price == nil {
			value := int(current.Price)
			input.Price = &value
		}
	}
	row, err := s.q.UpdateGrenadeClass(ctx, generated.UpdateGrenadeClassParams{
		GrenadeClassID: int32(id),
		Name:           input.Name,
		Description:    textValue(input.Description),
		Price:          int32(intValue(input.Price, 0)),
	})
	if err != nil {
		return grenadeclasses.GrenadeClass{}, mapNotFound(err, grenadeclasses.ErrNotFound)
	}
	return classFromUpdate(row), nil
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

func boolFilter(value *bool) pgtype.Bool {
	if value == nil {
		return pgtype.Bool{}
	}
	return pgtype.Bool{Bool: *value, Valid: true}
}

func textFilter(value string) pgtype.Text {
	if value == "" {
		return pgtype.Text{}
	}
	return pgtype.Text{String: value, Valid: true}
}

func intValue(value *int, fallback int) int {
	if value == nil {
		return fallback
	}
	return *value
}

func boolValue(value *bool, fallback bool) bool {
	if value == nil {
		return fallback
	}
	return *value
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

func sortMaps(items []maps.Map, ordering string) {
	switch ordering {
	case "by_alphabet":
		sort.Slice(items, func(i, j int) bool { return items[i].Name < items[j].Name })
	case "-by_alphabet":
		sort.Slice(items, func(i, j int) bool { return items[i].Name > items[j].Name })
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
