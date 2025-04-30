import { MutationOptions, QueryClient } from "@tanstack/react-query"
import { api } from "../../api"
import { grenadeApi, GrenadeModel } from "@entities/grenade"

export const deleteFromFavoritesMutation = (
    client: QueryClient
): MutationOptions<
    unknown,
    unknown,
    Pick<GrenadeModel, "grenadeId">,
    { prevData: GrenadeModel | undefined }
> => ({
    mutationFn: api.deleteFromFavorites,
    onMutate: async ({ grenadeId }) => {
        const requestParams = grenadeApi.getGrenadesByIdOptions({ grenadeId })
        await client.cancelQueries({
            queryKey: requestParams.queryKey,
        })

        const prevData = client.getQueryData(requestParams.queryKey)

        client.setQueryData(requestParams.queryKey, (prev) => {
            if (!prev) {
                return undefined
            }

            return {
                ...prev,
                isFavorite: false,
            }
        })

        return {
            prevData,
        }
    },
    onError: (_, { grenadeId }, context) => {
        if (context) {
            client.setQueryData(
                grenadeApi.getGrenadesByIdOptions({ grenadeId }).queryKey,
                context.prevData
            )
        }
    },
    onSettled: () => {
        client.invalidateQueries({ queryKey: grenadeApi.baseKey })
    },
})
