import { MutationOptions } from "@tanstack/react-query"
import { grenadeApi, GrenadeModel } from "@entities/grenade"
import { client, instance } from "@shared/api"

export const deleteFromFavorites = (): MutationOptions<
    unknown,
    unknown,
    Pick<GrenadeModel, "grenadeId"> & { signal?: AbortSignal },
    { prevData: GrenadeModel | undefined }
> => ({
    mutationFn: (params) =>
        instance.delete(`/favorites/${params.grenadeId}`, {
            signal: params.signal,
        }),
    onMutate: async (params) => {
        await client.cancelQueries({
            queryKey: [...grenadeApi.baseKey, "ById", params.grenadeId],
        })

        const prevData: GrenadeModel | undefined = await client.getQueryData([
            ...grenadeApi.baseKey,
            "ById",
            params.grenadeId,
        ])

        await client.setQueryData(
            [...grenadeApi.baseKey, "ById", params.grenadeId],
            { ...prevData, is_favorite: false }
        )

        return {
            prevData,
        }
    },
    onError: (_err, params, context) => {
        client.setQueryData(
            [...grenadeApi.baseKey, "ById", params.grenadeId],
            context?.prevData
        )
    },
    onSettled: (_data, _err, params) => {
        client.invalidateQueries({
            queryKey: [...grenadeApi.baseKey, "ById", params.grenadeId],
        })
    },
})
