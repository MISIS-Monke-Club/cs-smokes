import { UserModel } from "./domain"

export const defaultUser: UserModel = {
    user_id: 0,
    username: "Guest",
    avatar_url: null,
    steam_link: null,
    tg_id: null,
    email: null,
    first_name: null,
    last_name: null,
    is_banned: false,
}
