package telegram

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

type Client struct {
	token      string
	baseURL    string
	httpClient *http.Client
}

func NewClient(token string, baseURL string, httpClient *http.Client) *Client {
	if httpClient == nil {
		httpClient = http.DefaultClient
	}
	return &Client{
		token:      token,
		baseURL:    strings.TrimRight(baseURL, "/"),
		httpClient: httpClient,
	}
}

func (c *Client) SendMessage(ctx context.Context, req SendMessageRequest) error {
	return c.post(ctx, "sendMessage", req, nil)
}

func (c *Client) GetUpdates(ctx context.Context, offset int, timeout int) ([]Update, error) {
	req := getUpdatesRequest{Timeout: timeout}
	if offset > 0 {
		req.Offset = &offset
	}

	var updates []Update
	if err := c.post(ctx, "getUpdates", req, &updates); err != nil {
		return nil, err
	}
	return updates, nil
}

func (c *Client) post(ctx context.Context, method string, payload any, result any) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	url := fmt.Sprintf("%s/bot%s/%s", c.baseURL, c.token, method)
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return err
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var apiResp apiResponse[json.RawMessage]
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 || !apiResp.OK {
		if apiResp.Description != "" {
			return fmt.Errorf("telegram %s failed: %s", method, apiResp.Description)
		}
		return fmt.Errorf("telegram %s failed with status %d", method, resp.StatusCode)
	}
	if result == nil {
		return nil
	}
	return json.Unmarshal(apiResp.Result, result)
}
