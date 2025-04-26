export const BASE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL
export const TELEGRAM_INIT_DATA =
    import.meta.env.TG_ENVIRONMENT === "true" ? Telegram.WebApp.initData : ""
