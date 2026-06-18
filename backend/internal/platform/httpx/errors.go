package httpx

import (
	"encoding/json"
	"net/http"
)

type ErrorResponse struct {
	Error  string `json:"error"`
	Detail string `json:"detail,omitempty"`
}

func WriteJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func WriteError(w http.ResponseWriter, status int, code string, detail string) {
	WriteJSON(w, status, ErrorResponse{Error: code, Detail: detail})
}
