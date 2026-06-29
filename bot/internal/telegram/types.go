package telegram

type Update struct {
	UpdateID int      `json:"update_id"`
	Message  *Message `json:"message,omitempty"`
}

type Message struct {
	Chat       Chat        `json:"chat"`
	Text       string      `json:"text,omitempty"`
	WebAppData *WebAppData `json:"web_app_data,omitempty"`
}

type Chat struct {
	ID int64 `json:"id"`
}

type WebAppData struct {
	Data string `json:"data"`
}

type SendMessageRequest struct {
	ChatID      int64              `json:"chat_id"`
	Text        string             `json:"text"`
	ReplyMarkup InlineKeyboardMark `json:"reply_markup,omitempty"`
}

type InlineKeyboardMark struct {
	InlineKeyboard [][]InlineKeyboardButton `json:"inline_keyboard"`
}

type InlineKeyboardButton struct {
	Text   string      `json:"text"`
	WebApp *WebAppInfo `json:"web_app,omitempty"`
}

type WebAppInfo struct {
	URL string `json:"url"`
}

type apiResponse[T any] struct {
	OK          bool   `json:"ok"`
	Result      T      `json:"result"`
	Description string `json:"description,omitempty"`
}

type getUpdatesRequest struct {
	Offset  *int `json:"offset,omitempty"`
	Timeout int  `json:"timeout"`
}
