import { useMutation } from "@tanstack/react-query"
import { api } from "../api"
import { GrenadeModel } from "@entities/grenade"

export function useAddToFavorites() {
    const { mutateAsync, isError, isPending } = useMutation(
        api.addToFavoritesMutations()
    )

    const mutate = (grenadeId: Pick<GrenadeModel, "grenadeId">) =>
        mutateAsync({ grenadeId })

    return {
        addToFavorites: mutate,
        isMutationPending: isPending,
        isMutationError: isError,
    }
}
