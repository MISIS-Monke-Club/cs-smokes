package realtime

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/auth"
	"github.com/MISIS-Monke-Club/cs-smokes/backend/internal/pullrequests"
	"nhooyr.io/websocket"
	"nhooyr.io/websocket/wsjson"
)

type Handler struct {
	repo         Repository
	secret       string
	allowDevAnon bool
}

func NewHandler(repo Repository, secret string, allowDevAnon bool) Handler {
	return Handler{repo: repo, secret: secret, allowDevAnon: allowDevAnon}
}

func (h Handler) Comments(w http.ResponseWriter, r *http.Request) {
	actor, ok := h.authenticate(w, r)
	if !ok {
		return
	}
	if h.repo == nil {
		http.Error(w, "repository unavailable", http.StatusServiceUnavailable)
		return
	}
	prID := pullRequestID(r)
	conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{InsecureSkipVerify: true})
	if err != nil {
		return
	}
	defer conn.Close(websocket.StatusNormalClosure, "")

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()
	for {
		var message socketMessage
		if err := wsjson.Read(ctx, conn, &message); err != nil {
			return
		}
		switch message.Action {
		case "create":
			if message.UserID != 0 && message.UserID != actor.UserID {
				conn.Close(websocket.StatusPolicyViolation, "user_id mismatch")
				return
			}
			if message.Message == "" {
				conn.Close(websocket.StatusInvalidFramePayloadData, "message required")
				return
			}
			if _, err := h.repo.CreateComment(ctx, prID, actor, message.Message); err != nil {
				conn.Close(websocket.StatusInternalError, "create failed")
				return
			}
			h.broadcastComments(ctx, conn, prID)
		case "delete":
			if _, err := h.repo.DeleteComment(ctx, message.CommentID, actor); err != nil {
				conn.Close(websocket.StatusPolicyViolation, "delete denied")
				return
			}
			h.broadcastComments(ctx, conn, prID)
		default:
			conn.Close(websocket.StatusUnsupportedData, "unsupported action")
			return
		}
	}
}

func (h Handler) authenticate(w http.ResponseWriter, r *http.Request) (pullrequests.Actor, bool) {
	raw := r.URL.Query().Get("token")
	if raw == "" {
		if h.allowDevAnon {
			return pullrequests.Actor{UserID: 0}, true
		}
		http.Error(w, "missing token", http.StatusUnauthorized)
		return pullrequests.Actor{}, false
	}
	claims, err := auth.ParseAccessToken(h.secret, raw)
	if err != nil {
		http.Error(w, "invalid token", http.StatusUnauthorized)
		return pullrequests.Actor{}, false
	}
	return pullrequests.Actor{
		UserID:      claims.UserID,
		IsSuperuser: claims.IsSuperuser,
		IsBaseAdmin: claims.IsBaseAdmin,
		IsEditor:    claims.IsEditor,
	}, true
}

func (h Handler) broadcastComments(ctx context.Context, conn *websocket.Conn, prID int) {
	comments, err := h.repo.ListComments(ctx, prID)
	if err != nil {
		conn.Close(websocket.StatusInternalError, "list failed")
		return
	}
	dto := make([]pullrequests.CommentDTO, len(comments))
	for i, comment := range comments {
		dto[i] = pullrequests.ToCommentDTO(comment)
	}
	_ = wsjson.Write(ctx, conn, dto)
}

type socketMessage struct {
	Action    string `json:"action"`
	UserID    int    `json:"user_id"`
	Message   string `json:"message"`
	CommentID int    `json:"comment_id"`
}

func pullRequestID(r *http.Request) int {
	path := strings.Trim(r.URL.Path, "/")
	parts := strings.Split(path, "/")
	for i, part := range parts {
		if part == "pull_requests" && i+1 < len(parts) {
			id, _ := strconv.Atoi(parts[i+1])
			return id
		}
	}
	return 0
}

func MarshalDiagnostic(v any) []byte {
	out, _ := json.Marshal(v)
	return out
}
