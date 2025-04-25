import { useMutation } from "@tanstack/react-query"
import { deleteFromFavorites } from "./api"
import { GrenadeModel } from "@entities/grenade"

export function useDeleteFavorite() {
    const { mutateAsync, isPending } = useMutation(deleteFromFavorites())

    const deleteFavorite = (params: Pick<GrenadeModel, "grenadeId">) =>
        mutateAsync(params)

    return {
        deleteFavorite,
        isMutationPending: isPending,
    }
}
