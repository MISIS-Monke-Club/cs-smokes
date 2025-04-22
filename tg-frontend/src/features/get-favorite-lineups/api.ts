import { queryOptions } from "@tanstack/react-query"
import { AxiosResponse } from "axios"
import { toast } from "sonner"
import {
    fromGrenadeArrayDTO,
    grenadeDTOschema,
    GrenadeModel,
} from "@entities/grenade"
import { typedQuery } from "@shared/lib/precooked-methods"
import { instance } from "@shared/api"

export const api = {
    baseKey: ["favorites"],
    baseUrl: "favorites",
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
                }).catch((err) => {
                    console.error(err)
                    toast.error(
                        "something went wrong 'GET /favorites/:user_id'"
                    )

                    throw err
                })
            },
        }),
}
