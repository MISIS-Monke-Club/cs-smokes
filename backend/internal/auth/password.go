package auth

import (
	"crypto/pbkdf2"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"fmt"
	"strconv"
	"strings"
)

func VerifyPassword(password string, encoded string) (bool, error) {
	parts := strings.Split(encoded, "$")
	if len(parts) != 4 {
		return false, fmt.Errorf("invalid password hash format")
	}
	if parts[0] != "pbkdf2_sha256" {
		return false, fmt.Errorf("unsupported password algorithm %q", parts[0])
	}
	iterations, err := strconv.Atoi(parts[1])
	if err != nil {
		return false, fmt.Errorf("invalid iteration count: %w", err)
	}
	expected, err := base64.StdEncoding.DecodeString(parts[3])
	if err != nil {
		return false, fmt.Errorf("invalid password hash digest: %w", err)
	}
	derived, err := pbkdf2.Key(sha256.New, password, []byte(parts[2]), iterations, len(expected))
	if err != nil {
		return false, fmt.Errorf("derive password hash: %w", err)
	}
	return subtle.ConstantTimeCompare(derived, expected) == 1, nil
}
