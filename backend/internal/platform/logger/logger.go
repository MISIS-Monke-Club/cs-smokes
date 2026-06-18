package logger

import (
	"net/url"
	"strings"
)

func RedactTokenQuery(rawURL string) string {
	parsed, err := url.Parse(rawURL)
	if err != nil {
		return rawURL
	}
	query := parsed.Query()
	if _, ok := query["token"]; ok {
		query.Set("token", "[REDACTED]")
		parsed.RawQuery = strings.ReplaceAll(query.Encode(), "%5BREDACTED%5D", "[REDACTED]")
	}
	return parsed.String()
}
