import { UserModel } from "../model/domain"

export const mockUsers: Record<number, UserModel> = {
    1: {
        user_id: 1,
        username: "user1",
        avatar_url: "https://example.com/avatar1",
        steam_link: "https://example.com/steam1",
        tg_id: 1,
        email: "example1@mail.ru",
        first_name: "first1",
        last_name: "last1",
        is_banned: false,
    },
    2: {
        user_id: 2,
        username: "user2",
        avatar_url: "https://example.com/avatar2",
        steam_link: "https://example.com/steam2",
        tg_id: 2,
        email: "example2@mail.ru",
        first_name: "first2",
        last_name: "last2",
        is_banned: false,
    },
}
