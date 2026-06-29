package telegram

import (
	"context"
	"errors"
	"testing"
)

type recordingSender struct {
	requests []SendMessageRequest
	err      error
}

func (s *recordingSender) SendMessage(ctx context.Context, req SendMessageRequest) error {
	s.requests = append(s.requests, req)
	return s.err
}

func TestHandlerIgnoresUpdatesWithoutStartCommand(t *testing.T) {
	sender := &recordingSender{}
	handler := NewHandler(sender, "https://example.com/app")

	err := handler.HandleUpdate(context.Background(), Update{
		UpdateID: 1,
		Message:  &Message{Chat: Chat{ID: 42}, Text: "hello"},
	})
	if err != nil {
		t.Fatalf("HandleUpdate returned error: %v", err)
	}
	if len(sender.requests) != 0 {
		t.Fatalf("sent %d messages", len(sender.requests))
	}
}

func TestHandlerIgnoresUpdatesWithoutMessage(t *testing.T) {
	sender := &recordingSender{}
	handler := NewHandler(sender, "https://example.com/app")

	err := handler.HandleUpdate(context.Background(), Update{UpdateID: 1})
	if err != nil {
		t.Fatalf("HandleUpdate returned error: %v", err)
	}
	if len(sender.requests) != 0 {
		t.Fatalf("sent %d messages", len(sender.requests))
	}
}

func TestHandlerSendsStartMessageWithInitData(t *testing.T) {
	sender := &recordingSender{}
	handler := NewHandler(sender, "https://example.com/app")

	err := handler.HandleUpdate(context.Background(), Update{
		UpdateID: 1,
		Message: &Message{
			Chat:       Chat{ID: 42},
			Text:       "/start",
			WebAppData: &WebAppData{Data: "query_id=1"},
		},
	})
	if err != nil {
		t.Fatalf("HandleUpdate returned error: %v", err)
	}
	if len(sender.requests) != 1 {
		t.Fatalf("sent %d messages", len(sender.requests))
	}
	if sender.requests[0].ReplyMarkup.InlineKeyboard[0][0].WebApp.URL != "https://example.com/app?initData=query_id%3D1" {
		t.Fatalf("sent URL = %q", sender.requests[0].ReplyMarkup.InlineKeyboard[0][0].WebApp.URL)
	}
}

func TestHandlerAcceptsStartCommandWithPayload(t *testing.T) {
	sender := &recordingSender{}
	handler := NewHandler(sender, "https://example.com/app")

	err := handler.HandleUpdate(context.Background(), Update{
		UpdateID: 1,
		Message:  &Message{Chat: Chat{ID: 42}, Text: "/start campaign"},
	})
	if err != nil {
		t.Fatalf("HandleUpdate returned error: %v", err)
	}
	if len(sender.requests) != 1 {
		t.Fatalf("sent %d messages", len(sender.requests))
	}
}

func TestHandlerAcceptsStartCommandWithBotMention(t *testing.T) {
	sender := &recordingSender{}
	handler := NewHandler(sender, "https://example.com/app")

	err := handler.HandleUpdate(context.Background(), Update{
		UpdateID: 1,
		Message:  &Message{Chat: Chat{ID: 42}, Text: "/start@CsSmokesBot"},
	})
	if err != nil {
		t.Fatalf("HandleUpdate returned error: %v", err)
	}
	if len(sender.requests) != 1 {
		t.Fatalf("sent %d messages", len(sender.requests))
	}
}

func TestHandlerReturnsSendError(t *testing.T) {
	wantErr := errors.New("send failed")
	sender := &recordingSender{err: wantErr}
	handler := NewHandler(sender, "https://example.com/app")

	err := handler.HandleUpdate(context.Background(), Update{
		UpdateID: 1,
		Message:  &Message{Chat: Chat{ID: 42}, Text: "/start"},
	})
	if !errors.Is(err, wantErr) {
		t.Fatalf("HandleUpdate error = %v, want %v", err, wantErr)
	}
}

func TestHandlerReturnsWebAppURLError(t *testing.T) {
	sender := &recordingSender{}
	handler := NewHandler(sender, "://bad-url")

	err := handler.HandleUpdate(context.Background(), Update{
		UpdateID: 1,
		Message:  &Message{Chat: Chat{ID: 42}, Text: "/start"},
	})
	if err == nil {
		t.Fatalf("expected web app URL error")
	}
	if len(sender.requests) != 0 {
		t.Fatalf("sent %d messages", len(sender.requests))
	}
}
