import { MutationOptions, QueryClient } from "@tanstack/react-query"
import { api } from "../api"
import { grenadeApi, GrenadeModel } from "@entities/grenade"

export const addToFavoritesMutation = (
    client: QueryClient
): MutationOptions<
    unknown,
    unknown,
    Pick<GrenadeModel, "grenadeId">,
    { prevState: GrenadeModel | undefined }
> => ({
    mutationFn: api.postAddToFavorites,
    onMutate: async ({ grenadeId }) => {
        const requestParams = grenadeApi.getGrenadesByIdOptions({ grenadeId })
        await client.cancelQueries({ queryKey: requestParams.queryKey })

        // Getting state before mutation
        const prevState = client.getQueryData(requestParams.queryKey)

        client.setQueryData(requestParams.queryKey, (prev) => {
            if (!prev) {
                return undefined
            }

            return {
                ...prev,
                isFavorite: true,
            }
        })

        // Caching state to the context
        // Allows to restore previous state
        return {
            prevState,
        }
    },
    onError: (_, params, context) => {
        // Smt went wrong. resetting previous state (before optimistic update)
        if (context) {
            client.setQueryData(
                grenadeApi.getGrenadesByIdOptions({
                    grenadeId: params.grenadeId,
                }).queryKey,
                context.prevState
            )
        }
    },
    onSettled: () => {
        // Mutation updated server data, so data need to be re-fetched
        client.invalidateQueries({ queryKey: [grenadeApi.baseKey] })
    },
})
