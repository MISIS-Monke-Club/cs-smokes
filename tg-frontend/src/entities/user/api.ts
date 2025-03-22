import { queryOptions } from "@tanstack/react-query"
import { AxiosResponse } from "axios"
import { UserModel } from "./domain"
import { userDTOShema } from "./domain"
import { typedQuery } from "@shared/lib/precooked-methods"

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
    {
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
]

export const userApi = {
    baseKey: "user",
    getUserById: (userId?: number) =>
        queryOptions({
            queryKey: [userApi.baseKey, "profile", userId ?? "me"],
            queryFn: () =>
                new Promise<UserModel | undefined>((resolve, reject) => {
                    setTimeout(() => {
                        try {
                            const user = userId
                                ? mockUsers.find((u) => u.user_id === userId)
                                : mockUsers[0]

                            resolve(
                                typedQuery(
                                    Promise.resolve({
                                        data: user,
                                    } as AxiosResponse),
                                    userDTOShema
                                )
                            )
                        } catch (err) {
                            console.error(err)
                            reject(err)
                        }
                    }, 2000)
                }),
        }),
}
