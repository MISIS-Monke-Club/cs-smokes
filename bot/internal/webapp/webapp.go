package webapp

import "net/url"

func WithInitData(baseURL string, initData string) (string, error) {
	parsed, err := url.Parse(baseURL)
	if err != nil {
		return "", err
	}

	values := parsed.Query()
	values.Set("initData", initData)
	parsed.RawQuery = values.Encode()
	return parsed.String(), nil
}
