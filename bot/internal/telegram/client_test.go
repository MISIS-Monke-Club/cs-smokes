package telegram

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestClientSendMessagePostsTelegramPayload(t *testing.T) {
	var method string
	var path string
	var body []byte
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		method = r.Method
		path = r.URL.Path
		body, _ = io.ReadAll(r.Body)
		_, _ = w.Write([]byte(`{"ok":true}`))
	}))
	defer server.Close()

	client := NewClient("secret-token", server.URL, server.Client())
	req, err := BuildStartMessage(42, "https://example.com/app?initData=abc")
	if err != nil {
		t.Fatalf("BuildStartMessage returned error: %v", err)
	}

	if err := client.SendMessage(context.Background(), req); err != nil {
		t.Fatalf("SendMessage returned error: %v", err)
	}

	if method != http.MethodPost {
		t.Fatalf("method = %q, want POST", method)
	}
	if path != "/botsecret-token/sendMessage" {
		t.Fatalf("path = %q", path)
	}
	if !bytes.Contains(body, []byte(`"chat_id":42`)) {
		t.Fatalf("body missing chat_id: %s", body)
	}
	if !bytes.Contains(body, []byte(`"web_app":{"url":"https://example.com/app?initData=abc"}`)) {
		t.Fatalf("body missing web_app URL: %s", body)
	}
}

func TestClientSendMessageReportsTelegramFailure(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"ok":false,"description":"bad request"}`))
	}))
	defer server.Close()

	client := NewClient("secret-token", server.URL, server.Client())
	err := client.SendMessage(context.Background(), SendMessageRequest{ChatID: 42, Text: "hello"})
	if err == nil {
		t.Fatalf("expected Telegram failure")
	}
}

func TestClientGetUpdatesSendsOffsetAndTimeout(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/bottoken/getUpdates" {
			t.Fatalf("path = %q", r.URL.Path)
		}
		var req getUpdatesRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		if req.Offset == nil || *req.Offset != 10 {
			t.Fatalf("Offset = %#v", req.Offset)
		}
		if req.Timeout != 30 {
			t.Fatalf("Timeout = %d", req.Timeout)
		}
		_, _ = w.Write([]byte(`{"ok":true,"result":[{"update_id":10,"message":{"chat":{"id":7},"text":"/start"}}]}`))
	}))
	defer server.Close()

	client := NewClient("token", server.URL, server.Client())
	updates, err := client.GetUpdates(context.Background(), 10, 30)
	if err != nil {
		t.Fatalf("GetUpdates returned error: %v", err)
	}
	if len(updates) != 1 || updates[0].UpdateID != 10 || updates[0].Message.Chat.ID != 7 {
		t.Fatalf("updates = %#v", updates)
	}
}

func TestClientGetUpdatesOmitsZeroOffset(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var req getUpdatesRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		if req.Offset != nil {
			t.Fatalf("Offset = %#v, want nil", req.Offset)
		}
		_, _ = w.Write([]byte(`{"ok":true,"result":[]}`))
	}))
	defer server.Close()

	client := NewClient("token", server.URL+"/", nil)
	updates, err := client.GetUpdates(context.Background(), 0, 30)
	if err != nil {
		t.Fatalf("GetUpdates returned error: %v", err)
	}
	if len(updates) != 0 {
		t.Fatalf("updates = %#v", updates)
	}
}

func TestClientPostReportsRequestBuildError(t *testing.T) {
	client := NewClient("token", "://bad-url", nil)

	err := client.SendMessage(context.Background(), SendMessageRequest{ChatID: 1, Text: "hello"})
	if err == nil {
		t.Fatalf("expected request build error")
	}
}

func TestClientPostReportsMarshalError(t *testing.T) {
	client := NewClient("token", "https://example.com", nil)

	err := client.post(context.Background(), "sendMessage", make(chan int), nil)
	if err == nil {
		t.Fatalf("expected marshal error")
	}
}

func TestClientPostReportsHTTPError(t *testing.T) {
	wantErr := errors.New("network down")
	client := NewClient("token", "https://example.com", &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		return nil, wantErr
	})})

	err := client.SendMessage(context.Background(), SendMessageRequest{ChatID: 1, Text: "hello"})
	if !errors.Is(err, wantErr) {
		t.Fatalf("SendMessage error = %v, want %v", err, wantErr)
	}
}

func TestClientPostReportsDecodeError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`not-json`))
	}))
	defer server.Close()

	client := NewClient("token", server.URL, server.Client())
	err := client.SendMessage(context.Background(), SendMessageRequest{ChatID: 1, Text: "hello"})
	if err == nil {
		t.Fatalf("expected decode error")
	}
}

func TestClientPostReportsFailureWithoutDescription(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(`{"ok":false}`))
	}))
	defer server.Close()

	client := NewClient("token", server.URL, server.Client())
	err := client.SendMessage(context.Background(), SendMessageRequest{ChatID: 1, Text: "hello"})
	if err == nil {
		t.Fatalf("expected status error")
	}
}

func TestClientPostReportsResultUnmarshalError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"ok":true,"result":{}}`))
	}))
	defer server.Close()

	client := NewClient("token", server.URL, server.Client())
	_, err := client.GetUpdates(context.Background(), 0, 30)
	if err == nil {
		t.Fatalf("expected unmarshal error")
	}
}

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(r *http.Request) (*http.Response, error) {
	return f(r)
}
