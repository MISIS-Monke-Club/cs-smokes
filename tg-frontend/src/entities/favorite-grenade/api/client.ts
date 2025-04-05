import { queryOptions } from "@tanstack/react-query"
import { toast } from "sonner"
import { favoriteDTOschema, FavoriteModel } from "../model"
import { fromFavoriteDto } from "../lib/dto-transformer"
import { instance } from "@shared/api"
import { typedQuery } from "@shared/lib/precooked-methods"

export const api = {
    baseKey: "favorites",
    baseUrl: "lineups",
    getFavorites: () =>
        queryOptions({
            queryKey: [api.baseKey, "list"],
            queryFn: () =>
                typedQuery({
                    request: instance.get(`/${api.baseUrl}`),
                    dtoSchema: favoriteDTOschema,
                    fromDTO: fromFavoriteDto,
                }).catch((err) => {
                    console.error(err)
                    toast.error("Error acquired while getting favorites")

                    throw err
                }),
        }),
    getFavoritesById: ({
        favoriteId,
    }: {
        favoriteId: FavoriteModel["grenadeId"]
    }) =>
        queryOptions({
            queryKey: [api.baseKey, "list"],
            queryFn: () =>
                typedQuery({
                    request: instance.get(`/${api.baseUrl}/${favoriteId}`),
                    dtoSchema: favoriteDTOschema,
                    fromDTO: fromFavoriteDto,
                }).catch((err) => {
                    console.error(err)
                    toast.error("Error acquired while getting favorite grenade")

                    throw err
                }),
        }),
}
