import { useQueryClient, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { addToFavoritesMutation } from "./add-to-favorites"
import { GrenadeModel } from "@entities/grenade"

export function useAddFavorite({ grenadeId }: Pick<GrenadeModel, "grenadeId">) {
    const client = useQueryClient()
    const addMutation = useMutation(addToFavoritesMutation(client))

    const addToFavorites = () =>
        addMutation.mutateAsync({ grenadeId }).catch((err) => {
            console.error(
                `Error while add to favorites.\nGrenadeID: ${grenadeId}\nError: ${err}`
            )
            toast.error("cant add grenade to favorites")
        })

    return {
        addToFavorites,
        getIsPending: (id: GrenadeModel["grenadeId"]) =>
            addMutation.isPending && addMutation.variables.grenadeId === id,
    }
}
