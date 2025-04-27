export const BASE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL
export const TELEGRAM_INIT_DATA =
    import.meta.env.TG_ENVIRONMENT === "true"
        ? Telegram.WebApp.initData
        : "query_id=AAEGzPJFAAAAAAbM8kXOFRbF&user=%7B%22id%22%3A1173539846%2C%22first_name%22%3A%22Artemiy%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22Artemitol%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2F3iFn8Mh0iaAJL8ckvBz72NsTUauhz2O36WyUd-d1C4o.svg%22%7D&auth_date=1745680635&signature=coroYDv_jcIF_lJGrKLdLhB9gHLjXrWBSZn_vI13whD01pJbKuvr10leKKiZjeobi9w_caHVIB5pVUKKe-ijCQ&hash=71748da99c6f121a6d747e631d0ac159e6d6482a577c64edf22c95bb4118b814"
