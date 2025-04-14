import { MutationOptions } from "@tanstack/react-query"
import { favoritesApi } from "@entities/favorites"
import { grenadeApi, GrenadeModel } from "@entities/grenade"
import { client, instance } from "@shared/api"

export const api = {
    ...favoritesApi,
    addToFavoritesMutations: (): MutationOptions<
        unknown,
        unknown,
        { grenadeId: Pick<GrenadeModel, "grenadeId"> }
    > => ({
        mutationFn: (params) =>
            instance.post(api.baseUrl, { grenade_id: params.grenadeId }),
        onSuccess: (_, params) => {
            client.invalidateQueries({
                queryKey: [...grenadeApi.baseKey, "ById", params.grenadeId],
            })
        },
    }),
}
