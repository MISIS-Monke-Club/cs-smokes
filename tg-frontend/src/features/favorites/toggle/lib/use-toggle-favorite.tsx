import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { AddToFavorites } from "../ui/add-to-favorites/add-to-favorites"
import { DeleteFromFavorites } from "../ui/delete-from-favorites/delete-from-favorites"
import { grenadeApi, GrenadeModel } from "@entities/grenade"
import { Skeleton } from "@shared/ui/skeleton"

export function useToggleFavorite({
    grenadeId,
}: Pick<GrenadeModel, "grenadeId">) {
    const { data: grenade } = useQuery(
        grenadeApi.getGrenadesByIdOptions({ grenadeId })
    )

    const currentStatus: "in-favorites" | "not-in-favorites" | "unknown" =
        useMemo(() => {
            if (grenade) {
                if (grenade.isFavorite) return "in-favorites"
                else return "not-in-favorites"
            }

            return "unknown"
        }, [grenade])

    const buttonSlot = (
        <>
            {currentStatus === "not-in-favorites" ? (
                <AddToFavorites grenadeId={grenadeId} />
            ) : currentStatus === "in-favorites" ? (
                <DeleteFromFavorites grenadeId={grenadeId} />
            ) : (
                <Skeleton />
            )}
        </>
    )

    return {
        buttonSlot,
    }
}
