import { useMutation } from "@tanstack/react-query"
import { addToFavoritesMutations } from "../api"
import { GrenadeModel } from "@entities/grenade"

export function useAddToFavorites() {
    const { mutateAsync, isError, isPending } = useMutation(
        addToFavoritesMutations()
    )

    const mutate = (grenadeId: Pick<GrenadeModel, "grenadeId">) =>
        mutateAsync({ grenadeId })

    return {
        addToFavorites: mutate,
        isMutationPending: isPending,
        isMutationError: isError,
    }
}
