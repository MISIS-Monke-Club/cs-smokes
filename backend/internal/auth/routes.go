package auth

import "github.com/go-chi/chi/v5"

func RegisterRoutes(router chi.Router, handler Handler) {
	router.Post("/api/login/tg/", handler.TelegramLogin)
	router.Post("/api/login/tg", handler.TelegramLogin)
	router.Post("/api/login/", handler.Login)
	router.Post("/api/login", handler.Login)
	router.Post("/api/register/", handler.Register)
	router.Post("/api/register", handler.Register)
}
