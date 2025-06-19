/* eslint-disable import/order */
import { GrenadeModel } from "@entities/grenade"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteFromFavoritesMutation } from "./delete-from-favorites"
import { toast } from "sonner"

export function useDeleteFavorite({
    grenadeId,
}: Pick<GrenadeModel, "grenadeId">) {
    const client = useQueryClient()
    const deleteMutation = useMutation(deleteFromFavoritesMutation(client))

    const deleteFromFavorites = () =>
        deleteMutation.mutateAsync({ grenadeId }).catch((err) => {
            console.error(
                `Error while add to favorites.\nGrenadeID: ${grenadeId}\nError: ${err}`
            )
            toast.error("cant add grenade to favorites")
        })

    return {
        deleteFromFavorites,
        getIsPending: (id: GrenadeModel["grenadeId"]) =>
            deleteMutation.isPending &&
            deleteMutation.variables.grenadeId === id,
    }
}
