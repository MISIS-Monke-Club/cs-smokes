package telegram

import "errors"

const (
	startMessageText = "Нажми на кнопочку ниже и посмотри все интересующие тебя смоки:"
	webAppButtonText = "Открыть веб-приложение"
)

func BuildStartMessage(chatID int64, webAppURL string) (SendMessageRequest, error) {
	if webAppURL == "" {
		return SendMessageRequest{}, errors.New("web app URL is required")
	}

	return SendMessageRequest{
		ChatID: chatID,
		Text:   startMessageText,
		ReplyMarkup: InlineKeyboardMark{
			InlineKeyboard: [][]InlineKeyboardButton{
				{
					{
						Text:   webAppButtonText,
						WebApp: &WebAppInfo{URL: webAppURL},
					},
				},
			},
		},
	}, nil
}
