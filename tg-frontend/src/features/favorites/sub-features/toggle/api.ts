import { MutationOptions } from "@tanstack/react-query"
import { grenadeApi, GrenadeModel } from "@entities/grenade"
import { client, instance } from "@shared/api"

export const api = {
    baseUrl: "favorites",
    baseKey: [...grenadeApi.baseKey, "ById"],
    deleteFromFavorites: (): MutationOptions<
        unknown,
        unknown,
        Pick<GrenadeModel, "grenadeId"> & { signal?: AbortSignal },
        { prevData: GrenadeModel | undefined }
    > => ({
        mutationFn: (params) =>
            instance.delete(`/${api.baseUrl}/${params.grenadeId}`, {
                signal: params.signal,
            }),
        onMutate: async (params) => {
            const key = [...api.baseKey, params.grenadeId]
            await client.cancelQueries({
                queryKey: key,
            })

            const prevData = client.getQueryData<GrenadeModel>(key)

            client.setQueryData(key, {
                ...prevData,
                isFavorite: false,
            })

            return {
                prevData,
            }
        },
        onError: (_err, params, context) => {
            client.setQueryData(
                [...api.baseKey, params.grenadeId],
                context?.prevData
            )
        },
        onSettled: (_data, _err, params) => {
            client.invalidateQueries({
                queryKey: [...api.baseKey, params.grenadeId],
            })
        },
    }),
    addToFavoritesMutations: (): MutationOptions<
        unknown,
        unknown,
        Pick<GrenadeModel, "grenadeId">,
        { prevState: GrenadeModel | undefined }
    > => ({
        mutationFn: (params) =>
            instance.post(api.baseUrl, { grenade_id: params.grenadeId }),
        onMutate: async (params) => {
            const key = [...api.baseKey, params.grenadeId]
            await client.cancelQueries({
                queryKey: key,
            })

            // Getting state before mutation
            const prevState = client.getQueryData<GrenadeModel>(key)

            client.setQueryData(key, {
                ...prevState,
                isFavorite: true,
            })

            // Caching state to the context
            // Allows to restore previous state
            return {
                prevState,
            }
        },
        onError: (_, params, context) => {
            // Smt went wrong. resetting previous state (before optimistic update)
            client.setQueryData(
                [...api.baseKey, params.grenadeId],
                context?.prevState
            )
        },
        onSettled: (_data, _error, params) => {
            // Mutation updated server data, so data need to be re-fetched
            client.invalidateQueries({
                queryKey: [...api.baseKey, params.grenadeId],
            })
        },
    }),
}
