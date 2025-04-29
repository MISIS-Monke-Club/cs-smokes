import { queryOptions } from "@tanstack/react-query"
import { toast } from "sonner"
import {
    fromGrenadeArrayDTO,
    grenadeApi,
    grenadeDTOschema,
} from "@entities/grenade"
import { typedQuery } from "@shared/lib/precooked-methods"
import { instance } from "@shared/api"
import { UserModel } from "@entities/user"

export const api = {
    baseKey: [...grenadeApi.baseKey, "favorites"],
    baseUrl: "favorites",

    getFavoritesByUserId: ({ userId }: Pick<UserModel, "userId">) =>
        typedQuery({
            request: instance.get(`${api.baseUrl}/${userId}`),
            fromDTO: fromGrenadeArrayDTO,
            dtoSchema: grenadeDTOschema.array(),
        }).catch((err) => {
            console.error(err)
            toast.error("something went wrong 'GET /favorites/:user_id'")

            throw err
        }),
    getFavoritesByUserIdOptions: ({ userId }: Pick<UserModel, "userId">) =>
        queryOptions({
            queryKey: [...api.baseKey, { type: "byId", userId }],
            queryFn: () => api.getFavoritesByUserId({ userId }),
        }),
}
