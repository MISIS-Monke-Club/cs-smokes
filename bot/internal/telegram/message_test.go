package telegram

import "testing"

func TestBuildStartMessagePreservesTextAndWebAppButton(t *testing.T) {
	req, err := BuildStartMessage(42, "https://example.com/app?initData=abc")
	if err != nil {
		t.Fatalf("BuildStartMessage returned error: %v", err)
	}

	if req.ChatID != 42 {
		t.Fatalf("ChatID = %d, want 42", req.ChatID)
	}
	if req.Text != "Нажми на кнопочку ниже и посмотри все интересующие тебя смоки:" {
		t.Fatalf("Text = %q", req.Text)
	}
	if len(req.ReplyMarkup.InlineKeyboard) != 1 || len(req.ReplyMarkup.InlineKeyboard[0]) != 1 {
		t.Fatalf("unexpected keyboard shape: %#v", req.ReplyMarkup.InlineKeyboard)
	}
	button := req.ReplyMarkup.InlineKeyboard[0][0]
	if button.Text != "Открыть веб-приложение" {
		t.Fatalf("button text = %q", button.Text)
	}
	if button.WebApp == nil {
		t.Fatalf("button WebApp is nil")
	}
	if button.WebApp.URL != "https://example.com/app?initData=abc" {
		t.Fatalf("button WebApp URL = %q", button.WebApp.URL)
	}
}

func TestBuildStartMessageRejectsEmptyWebAppURL(t *testing.T) {
	if _, err := BuildStartMessage(42, ""); err == nil {
		t.Fatalf("expected empty Web App URL to fail")
	}
}
