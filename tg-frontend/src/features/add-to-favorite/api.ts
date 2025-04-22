import { MutationOptions } from "@tanstack/react-query"
import { grenadeApi, GrenadeModel } from "@entities/grenade"
import { client, instance } from "@shared/api"

export const api = {
    baseKey: ["favorites"],
    baseUrl: "favorites",
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
