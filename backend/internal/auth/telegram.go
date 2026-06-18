package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/url"
	"sort"
	"strings"
)

type TelegramUser struct {
	ID        int64  `json:"id"`
	Username  string `json:"username"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	PhotoURL  string `json:"photo_url"`
}

func CheckTelegramWebAppSignature(token string, initData string) bool {
	values, err := url.ParseQuery(initData)
	if err != nil {
		return false
	}
	providedHash := values.Get("hash")
	if providedHash == "" {
		return false
	}
	values.Del("hash")

	dataCheckString := telegramDataCheckString(values)
	secretMAC := hmac.New(sha256.New, []byte("WebAppData"))
	_, _ = secretMAC.Write([]byte(token))
	secret := secretMAC.Sum(nil)

	dataMAC := hmac.New(sha256.New, secret)
	_, _ = dataMAC.Write([]byte(dataCheckString))
	expectedHash := hex.EncodeToString(dataMAC.Sum(nil))
	return hmac.Equal([]byte(expectedHash), []byte(providedHash))
}

func ParseTelegramUser(initData string) (TelegramUser, error) {
	values, err := url.ParseQuery(initData)
	if err != nil {
		return TelegramUser{}, err
	}
	rawUser := values.Get("user")
	if rawUser == "" {
		return TelegramUser{}, fmt.Errorf("telegram user is missing")
	}
	var user TelegramUser
	if err := json.Unmarshal([]byte(rawUser), &user); err != nil {
		return TelegramUser{}, err
	}
	if user.ID == 0 {
		return TelegramUser{}, fmt.Errorf("telegram user id is missing")
	}
	return user, nil
}

func telegramDataCheckString(values url.Values) string {
	keys := make([]string, 0, len(values))
	for key := range values {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	parts := make([]string, 0, len(keys))
	for _, key := range keys {
		parts = append(parts, key+"="+values.Get(key))
	}
	return strings.Join(parts, "\n")
}
