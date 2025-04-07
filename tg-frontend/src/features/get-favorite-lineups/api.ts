import { queryOptions } from "@tanstack/react-query"
import { AxiosResponse } from "axios"
import {
    fromGrenadeArrayDTO,
    grenadeDTOschema,
    GrenadeModel,
} from "@entities/grenade"
import { typedQuery } from "@shared/lib/precooked-methods"
import { instance } from "@shared/api"
import { favoritesApi } from "@entities/favorites"

export const api = {
    ...favoritesApi,
    getFavoriteLineupsByUserId: (userId: number | null) =>
        queryOptions<GrenadeModel[]>({
            queryKey: [...api.baseKey, "ById", userId],
            queryFn: () => {
                let req: Promise<AxiosResponse>

                if (!userId) {
                    req = Promise.reject(
                        new Error(
                            "User id was not provided, rejecting request to the server (GET /favorites/:id)"
                        )
                    )
                } else {
                    req = instance.get(`${api.baseUrl}/${userId}`)
                }

                return typedQuery({
                    request: req,
                    fromDTO: fromGrenadeArrayDTO,
                    dtoSchema: grenadeDTOschema.array(),
                })
            },
        }),
}
