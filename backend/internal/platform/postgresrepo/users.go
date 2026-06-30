package postgresrepo

import (
	"context"
	"fmt"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/auth"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/db/generated"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/users"
	"github.com/jackc/pgx/v5/pgtype"
)

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

func (s *Store) SetUserRoles(ctx context.Context, userID int, roles auth.RoleSet) error {
	if err := s.q.DeleteUserRoles(ctx, int32(userID)); err != nil {
		return err
	}
	for _, code := range roleCodes(roles) {
		if err := s.q.AddUserRoleByCode(ctx, generated.AddUserRoleByCodeParams{UserID: int32(userID), Code: code}); err != nil {
			return err
		}
	}
	return nil
}

func roleCodes(roles auth.RoleSet) []string {
	var codes []string
	if roles.IsSuperuser {
		codes = append(codes, "superuser")
	}
	if roles.IsBaseAdmin {
		codes = append(codes, "base_admin")
	}
	if roles.IsEditor {
		codes = append(codes, "editor")
	}
	return codes
}
