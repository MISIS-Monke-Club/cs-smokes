package telegram

import (
	"context"
	"strings"
	"unicode"

	"github.com/MISIS-Monke-Club/cs-smokes/bot/internal/webapp"
)

type Sender interface {
	SendMessage(ctx context.Context, req SendMessageRequest) error
}

type Handler struct {
	sender    Sender
	webAppURL string
}

func NewHandler(sender Sender, webAppURL string) *Handler {
	return &Handler{sender: sender, webAppURL: webAppURL}
}

func (h *Handler) HandleUpdate(ctx context.Context, update Update) error {
	if update.Message == nil || !isStartCommand(update.Message.Text) {
		return nil
	}

	initData := ""
	if update.Message.WebAppData != nil {
		initData = update.Message.WebAppData.Data
	}

	url, err := webapp.WithInitData(h.webAppURL, initData)
	if err != nil {
		return err
	}
	req, _ := BuildStartMessage(update.Message.Chat.ID, url)
	return h.sender.SendMessage(ctx, req)
}

func isStartCommand(text string) bool {
	command := strings.TrimSpace(text)
	if !strings.HasPrefix(command, "/start") {
		return false
	}
	if len(command) == len("/start") {
		return true
	}

	next := rune(command[len("/start")])
	return next == '@' || unicode.IsSpace(next)
}
