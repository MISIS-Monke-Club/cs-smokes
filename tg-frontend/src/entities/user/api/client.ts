import { queryOptions } from "@tanstack/react-query"
import { AxiosResponse } from "axios"
import { toast } from "sonner"
import { userDTOschema } from "../model/domain"
import { mockUsers } from "./__mocks"
import { typedQuery } from "@shared/lib/precooked-methods"

export const api = {
    baseKey: "user",
    baseUrl: "profile",
    getUserById: (userId: number | null) =>
        queryOptions({
            queryKey: [api.baseKey, "ById", userId],
            queryFn: () => {
                let req: Promise<AxiosResponse>

                // If there is no user id - request will be catched (prevented)
                if (userId === null) {
                    req = Promise.reject(
                        "User id was not provided, rejecting request"
                    )
                } else {
                    // req = instance.get(`${api.baseUrl}/${userId}`)
                    // TODO: Remove this is mock
                    req = Promise.resolve({
                        data: mockUsers[userId],
                    } as AxiosResponse)
                }

                return typedQuery(
                    req.catch((err) => {
                        console.error(err)
                        toast.error(`cant get data about user (id:${userId})`)

                        throw err
                    }),
                    userDTOschema
                )
            },
        }),
}
