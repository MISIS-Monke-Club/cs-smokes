package realtime_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/auth"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/pullrequests"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/realtime"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/users"
	"github.com/golang-jwt/jwt/v5"
	"nhooyr.io/websocket"
	"nhooyr.io/websocket/wsjson"
)

func TestWebSocketRejectsMissingMalformedAndExpiredToken(t *testing.T) {
	server := newRealtimeServer(t, false)
	defer server.Close()

	for _, rawURL := range []string{
		server.URL,
		server.URL + "?token=malformed.token.value",
		server.URL + "?token=" + expiredToken(t, "secret"),
	} {
		ctx, cancel := context.WithTimeout(context.Background(), time.Second)
		_, _, err := websocket.Dial(ctx, strings.Replace(rawURL, "http://", "ws://", 1), nil)
		cancel()
		if err == nil {
			t.Fatalf("dial %s unexpectedly succeeded", rawURL)
		}
	}
}

func TestWebSocketValidCreateBroadcastsFullComments(t *testing.T) {
	server := newRealtimeServer(t, false)
	defer server.Close()
	token := validToken(t, "secret", 7)

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	conn, _, err := websocket.Dial(ctx, strings.Replace(server.URL, "http://", "ws://", 1)+"?token="+token, nil)
	if err != nil {
		t.Fatalf("dial: %v", err)
	}
	defer conn.Close(websocket.StatusNormalClosure, "")

	if err := wsjson.Write(ctx, conn, map[string]any{"action": "create", "user_id": 7, "message": "looks good"}); err != nil {
		t.Fatalf("write create: %v", err)
	}
	var broadcast []map[string]any
	if err := wsjson.Read(ctx, conn, &broadcast); err != nil {
		t.Fatalf("read broadcast: %v", err)
	}
	if len(broadcast) != 1 || broadcast[0]["text"] != "looks good" {
		t.Fatalf("broadcast = %#v", broadcast)
	}
}

func TestWebSocketDeleteBroadcastsRemainingComments(t *testing.T) {
	repo := &fakeRealtimeRepo{
		comments: []pullrequests.Comment{
			{
				ID:            1,
				PullRequestID: 3,
				Text:          "first",
				Creator:       users.User{UserID: 7, Username: "player"},
				CreatorRole:   "user",
				CreatedAt:     "2026-01-01T00:00:00Z",
			},
			{
				ID:            2,
				PullRequestID: 3,
				Text:          "second",
				Creator:       users.User{UserID: 7, Username: "player"},
				CreatorRole:   "user",
				CreatedAt:     "2026-01-01T00:00:01Z",
			},
		},
	}
	server := newRealtimeServerWithRepo(t, repo, false)
	defer server.Close()
	token := validToken(t, "secret", 7)

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	conn, _, err := websocket.Dial(ctx, strings.Replace(server.URL, "http://", "ws://", 1)+"?token="+token, nil)
	if err != nil {
		t.Fatalf("dial: %v", err)
	}
	defer conn.Close(websocket.StatusNormalClosure, "")

	if err := wsjson.Write(ctx, conn, map[string]any{"action": "delete", "comment_id": 1}); err != nil {
		t.Fatalf("write delete: %v", err)
	}
	var broadcast []map[string]any
	if err := wsjson.Read(ctx, conn, &broadcast); err != nil {
		t.Fatalf("read broadcast: %v", err)
	}
	if len(broadcast) != 1 || broadcast[0]["text"] != "second" {
		t.Fatalf("broadcast = %#v", broadcast)
	}
}

func TestWebSocketRejectsMismatchedUserID(t *testing.T) {
	server := newRealtimeServer(t, false)
	defer server.Close()
	token := validToken(t, "secret", 7)

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	conn, _, err := websocket.Dial(ctx, strings.Replace(server.URL, "http://", "ws://", 1)+"?token="+token, nil)
	if err != nil {
		t.Fatalf("dial: %v", err)
	}
	defer conn.Close(websocket.StatusNormalClosure, "")

	if err := wsjson.Write(ctx, conn, map[string]any{"action": "create", "user_id": 8, "message": "bad"}); err != nil {
		t.Fatalf("write create: %v", err)
	}
	var ignored any
	if err := wsjson.Read(ctx, conn, &ignored); err == nil {
		t.Fatalf("mismatched user_id unexpectedly received message")
	}
}

func newRealtimeServer(t *testing.T, allowUnauth bool) *httptest.Server {
	t.Helper()
	return newRealtimeServerWithRepo(t, &fakeRealtimeRepo{}, allowUnauth)
}

func newRealtimeServerWithRepo(t *testing.T, repo *fakeRealtimeRepo, allowUnauth bool) *httptest.Server {
	t.Helper()
	handler := realtime.NewHandler(repo, "secret", allowUnauth)
	mux := http.NewServeMux()
	mux.HandleFunc("/", handler.Comments)
	return httptest.NewServer(mux)
}

type fakeRealtimeRepo struct {
	comments []pullrequests.Comment
}

func (r *fakeRealtimeRepo) ListComments(context.Context, int) ([]pullrequests.Comment, error) {
	return r.comments, nil
}

func (r *fakeRealtimeRepo) CreateComment(_ context.Context, prID int, actor pullrequests.Actor, text string) (pullrequests.Comment, error) {
	comment := pullrequests.Comment{
		ID:            len(r.comments) + 1,
		PullRequestID: prID,
		Text:          text,
		Creator:       users.User{UserID: actor.UserID, Username: "player"},
		CreatorRole:   "user",
		CreatedAt:     "2026-01-01T00:00:00Z",
	}
	r.comments = append(r.comments, comment)
	return comment, nil
}

func (r *fakeRealtimeRepo) DeleteComment(_ context.Context, commentID int, _ pullrequests.Actor) ([]pullrequests.Comment, error) {
	for i, comment := range r.comments {
		if comment.ID == commentID {
			r.comments = append(r.comments[:i], r.comments[i+1:]...)
			return r.comments, nil
		}
	}
	return nil, pullrequests.ErrNotFound
}

func validToken(t *testing.T, secret string, userID int) string {
	t.Helper()
	pair, err := auth.IssueTokenPair(secret, auth.UserClaims{UserID: userID, Username: "player"})
	if err != nil {
		t.Fatalf("issue token: %v", err)
	}
	return pair.AccessToken
}

func expiredToken(t *testing.T, secret string) string {
	t.Helper()
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  7,
		"username": "expired",
		"exp":      time.Now().Add(-time.Hour).Unix(),
	}).SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("expired token: %v", err)
	}
	return token
}
