package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/auth"
	"github.com/golang-jwt/jwt/v5"
	"nhooyr.io/websocket"
	"nhooyr.io/websocket/wsjson"
)

func main() {
	var captureDir string
	var secretKey string
	var userID int
	var wsURL string
	var writeOnly bool
	flag.StringVar(&captureDir, "capture-dir", "./tmp/logscan", "capture output directory")
	flag.StringVar(&secretKey, "secret-key", "", "JWT secret key")
	flag.IntVar(&userID, "user-id", 1, "probe user id")
	flag.StringVar(&wsURL, "ws-url", "", "websocket URL")
	flag.BoolVar(&writeOnly, "write-sentinels-only", false, "only write sentinel/config files")
	flag.Bool("mint-valid-token", false, "accepted for compatibility")
	flag.String("base-url", "", "accepted for compatibility")
	flag.Parse()

	if err := run(captureDir, secretKey, userID, wsURL, writeOnly); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run(captureDir string, secretKey string, userID int, wsURL string, writeOnly bool) error {
	if secretKey == "" {
		return fmt.Errorf("--secret-key is required")
	}
	if err := os.MkdirAll(captureDir, 0o755); err != nil {
		return err
	}
	valid, err := auth.IssueTokenPair(secretKey, auth.UserClaims{UserID: userID, Username: "probe"})
	if err != nil {
		return err
	}
	expired, err := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  userID,
		"username": "expired",
		"exp":      time.Now().Add(-time.Hour).Unix(),
	}).SignedString([]byte(secretKey))
	if err != nil {
		return err
	}
	sentinels := valid.AccessToken + "\nmalformed.token.value\nexpired.token.value\n" + expired + "\n"
	if err := os.WriteFile(filepath.Join(captureDir, "sentinels.txt"), []byte(sentinels), 0o600); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(captureDir, "effective-config.txt"), []byte("WS_ALLOW_UNAUTHENTICATED_DEV=false\n"), 0o600); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(captureDir, "client-diagnostics.log"), []byte("token=[REDACTED]\n"), 0o600); err != nil {
		return err
	}
	if writeOnly || wsURL == "" {
		return nil
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	conn, _, err := websocket.Dial(ctx, wsURL+"?token="+valid.AccessToken, nil)
	if err != nil {
		return err
	}
	defer conn.Close(websocket.StatusNormalClosure, "")
	if err := wsjson.Write(ctx, conn, map[string]any{"action": "create", "user_id": userID, "message": "probe"}); err != nil {
		return err
	}
	var broadcast any
	return wsjson.Read(ctx, conn, &broadcast)
}
