import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useMemo } from "react"
import { addToFavoritesMutation } from "./add-to-favorites"
import { deleteFromFavoritesMutation } from "./delete-from-favorites"
import { grenadeApi, GrenadeModel } from "@entities/grenade"

export function useToggleFavorite(hookParams: Pick<GrenadeModel, "grenadeId">) {
    const client = useQueryClient()
    const { mutateAsync: deleteMutation, isPending: isDeletePending } =
        useMutation(deleteFromFavoritesMutation(client))
    const { mutateAsync: addMutation, isPending: isAddPending } = useMutation(
        addToFavoritesMutation(client)
    )
    const { data } = useQuery(
        grenadeApi.getGrenadesByIdOptions({ grenadeId: hookParams.grenadeId })
    )

    const currentStatus: "in-favorites" | "not-in-favorite" = useMemo(() => {
        if (data) {
            const flag = data.isFavorite

            if (flag) return "in-favorites"
        }

        return "not-in-favorite"
    }, [data])

    const toggleFavorite = () => {
        if (currentStatus === "in-favorites") {
            return deleteFromFavorites()
        } else {
            return addToFavorites()
        }
    }

    const addToFavorites = () =>
        addMutation(hookParams).catch((err) => {
            console.error(
                `Error while add to favorites.\nGrenadeID: ${hookParams.grenadeId}\nError: ${err}`
            )
            toast.error("cant add grenade to favorites")
        })
    const deleteFromFavorites = () =>
        deleteMutation(hookParams).catch((err) => {
            console.error(
                `Error while add to favorites.\nGrenadeID: ${hookParams.grenadeId}\nError: ${err}`
            )
            toast.error("cant add grenade to favorites")
        })

    return {
        // To prevent any actions if smt is in run
        isPending: isAddPending || isDeletePending,
        toggleFavorite,
        currentState: currentStatus,
    }
}
