# Telegram Bot

Go Telegram polling bot for the CS Smokes Telegram Web App.

## Environment

- `TOKEN`: Telegram bot token. The backend also uses this token to validate Telegram WebApp auth data.
- `WEB_APP_URL`: public Telegram Web App URL opened by the `/start` inline button.

## Commands

```bash
go test ./...
go test ./... -coverprofile=coverage.out
go tool cover -func=coverage.out
go run ./cmd/bot
```

The bot preserves the legacy `/start` behavior: it sends the Russian prompt and an inline Web App button with `initData` appended to `WEB_APP_URL`.
