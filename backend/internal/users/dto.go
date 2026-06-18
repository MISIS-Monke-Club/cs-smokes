package users

type User struct {
	UserID    int
	Username  string
	Email     *string
	FirstName *string
	LastName  *string
	AvatarURL *string
	SteamLink *string
	TgID      *int64
	IsBanned  bool
}

type UserDTO struct {
	UserID    int     `json:"user_id"`
	Username  string  `json:"username"`
	Email     *string `json:"email"`
	FirstName *string `json:"first_name"`
	LastName  *string `json:"last_name"`
	AvatarURL *string `json:"avatar_url"`
	SteamLink *string `json:"steam_link"`
	TgID      *int64  `json:"tg_id"`
	IsBanned  bool    `json:"is_banned"`
}

type ProfileDTO struct {
	UserID    int     `json:"user_id"`
	Username  string  `json:"username"`
	AvatarURL *string `json:"avatar_url"`
	FirstName *string `json:"first_name"`
	LastName  *string `json:"last_name"`
}

type UserInput struct {
	Username  string  `json:"username"`
	Email     *string `json:"email"`
	Password  string  `json:"password"`
	FirstName *string `json:"first_name"`
	LastName  *string `json:"last_name"`
	AvatarURL *string `json:"avatar_url"`
	SteamLink *string `json:"steam_link"`
}

func ToDTO(user User) UserDTO {
	return UserDTO{
		UserID:    user.UserID,
		Username:  user.Username,
		Email:     user.Email,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		AvatarURL: user.AvatarURL,
		SteamLink: user.SteamLink,
		TgID:      user.TgID,
		IsBanned:  user.IsBanned,
	}
}

func ToProfileDTO(user User) ProfileDTO {
	return ProfileDTO{
		UserID:    user.UserID,
		Username:  user.Username,
		AvatarURL: user.AvatarURL,
		FirstName: user.FirstName,
		LastName:  user.LastName,
	}
}
