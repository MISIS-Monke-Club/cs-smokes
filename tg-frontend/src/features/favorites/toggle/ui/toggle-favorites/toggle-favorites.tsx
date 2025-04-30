import { useToggleFavorite } from "../../lib/use-toggle-favorite"
import { GrenadeModel } from "@entities/grenade"

type ToggleFavoritesProps = Pick<GrenadeModel, "grenadeId">

export function ToggleFavorites({ grenadeId }: ToggleFavoritesProps) {
    const { buttonSlot } = useToggleFavorite({
        grenadeId,
    })

    return <>{buttonSlot}</>
}
