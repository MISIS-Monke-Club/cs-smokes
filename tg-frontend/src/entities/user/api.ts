import { queryOptions } from "@tanstack/react-query"
import { UserModel } from "./userSchema"

const mockUsers: UserModel[] = [
    {
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
]

export const api = {
    baseKey: "user",
    getUser: () =>
        queryOptions<UserModel>({
            queryKey: [api.baseKey, "profile"],
            queryFn: () =>
                new Promise((resolve, reject) => {
                    setTimeout(() => {
                        try {
                            resolve(mockUsers[0])
                        } catch (err) {
                            console.error(err)
                            reject(err)
                        }
                    }, 2000)
                }),
        }),
}
