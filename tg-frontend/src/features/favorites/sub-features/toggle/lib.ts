import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { useMemo } from "react"
import { api } from "./api"
import { grenadeApi, GrenadeModel } from "@entities/grenade"

export function useToggleFavorite(hookParams: Pick<GrenadeModel, "grenadeId">) {
    const { mutateAsync: deleteMutation, isPending: isDeletePending } =
        useMutation(api.deleteFromFavorites())
    const { mutateAsync: addMutation, isPending: isAddPending } = useMutation(
        api.addToFavoritesMutations()
    )
    const { data } = useQuery(
        grenadeApi.getGrenadeById({ grenadeId: hookParams.grenadeId })
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
