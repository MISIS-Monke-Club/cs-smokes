package auth

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type UserClaims struct {
	UserID      int
	Username    string
	IsSuperuser bool
	IsBaseAdmin bool
	IsEditor    bool
}

type TokenPair struct {
	AccessToken  string
	RefreshToken string
}

func IssueTokenPair(secret string, user UserClaims) (TokenPair, error) {
	access, err := issueToken(secret, user, 15*time.Minute, "access")
	if err != nil {
		return TokenPair{}, err
	}
	refresh, err := issueToken(secret, user, 7*24*time.Hour, "refresh")
	if err != nil {
		return TokenPair{}, err
	}
	return TokenPair{AccessToken: access, RefreshToken: refresh}, nil
}

func ParseAccessToken(secret string, tokenString string) (UserClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil {
		return UserClaims{}, err
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return UserClaims{}, fmt.Errorf("invalid token")
	}
	return UserClaims{
		UserID:      int(asFloat64(claims["user_id"])),
		Username:    asString(claims["username"]),
		IsSuperuser: asBool(claims["is_superuser"]),
		IsBaseAdmin: asBool(claims["is_base_admin"]),
		IsEditor:    asBool(claims["is_editor"]),
	}, nil
}

func issueToken(secret string, user UserClaims, ttl time.Duration, tokenType string) (string, error) {
	claims := jwt.MapClaims{
		"user_id":       user.UserID,
		"username":      user.Username,
		"is_superuser":  user.IsSuperuser,
		"is_base_admin": user.IsBaseAdmin,
		"is_editor":     user.IsEditor,
		"token_type":    tokenType,
		"exp":           time.Now().Add(ttl).Unix(),
		"iat":           time.Now().Unix(),
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(secret))
}

func asFloat64(value any) float64 {
	number, _ := value.(float64)
	return number
}

func asString(value any) string {
	text, _ := value.(string)
	return text
}

func asBool(value any) bool {
	boolean, _ := value.(bool)
	return boolean
}
