import { MutationOptions } from "@tanstack/react-query"
import { grenadeApi, GrenadeModel } from "@entities/grenade"
import { client, instance } from "@shared/api"

export const addToFavoritesMutations = (): MutationOptions<
    unknown,
    unknown,
    { grenadeId: Pick<GrenadeModel, "grenadeId"> },
    { prevState: GrenadeModel | undefined }
> => ({
    mutationFn: (params) =>
        instance.post("/favorites", { grenade_id: params.grenadeId }),
    onMutate: async (params) => {
        const key = [...grenadeApi.baseKey, "ById", params.grenadeId]

        await client.cancelQueries({
            queryKey: key,
        })

        const prevState: GrenadeModel | undefined =
            await client.getQueryData(key)

        await client.setQueryData(key, {
            ...prevState,
            is_favorite: true,
        })

        return {
            prevState,
        }
    },
    onError: (_, params, context) => {
        client.setQueryData(
            [...grenadeApi.baseKey, "ById", params.grenadeId],
            context?.prevState
        )
    },
    onSettled: (_data, _error, params) => {
        client.invalidateQueries({
            queryKey: [...grenadeApi.baseKey, "ById", params.grenadeId],
        })
    },
})
