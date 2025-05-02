import { queryOptions } from "@tanstack/react-query"
import { toast } from "sonner"
import { userDTOschema, UserModel } from "../model/domain"
import { fromUserDTO } from "../lib/from-dto"
import { typedQuery } from "@shared/lib/precooked-methods"
import { instance } from "@shared/api"

export const api = {
    baseKey: "user",
    baseUrl: "profile",
    getUserById: (userId: number) =>
        queryOptions<UserModel>({
            queryKey: [api.baseKey, "ById", userId],
            queryFn: () =>
                typedQuery({
                    request: instance.get(`/api.baseUrl/${userId}`),
                    dtoSchema: userDTOschema,
                    fromDTO: fromUserDTO,
                }).catch((err) => {
                    console.error(err)
                    toast.error(`cant get data about user (id:${userId})`)

                    throw err
                }),
        }),
}
