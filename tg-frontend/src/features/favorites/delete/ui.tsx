import { Heart } from "lucide-react"
import { useDeleteFavorite } from "./lib"
import { GrenadeModel } from "@entities/grenade"
import { Button } from "@shared/ui/button"

type DeleteFromFavoritesProps = React.ComponentProps<"button"> &
    Pick<GrenadeModel, "grenadeId">

export function DeleteFromFavorites({
    grenadeId,
    ...rest
}: DeleteFromFavoritesProps) {
    const { deleteFavorite } = useDeleteFavorite()

    function clickHandler() {
        deleteFavorite({ grenadeId })
    }

    return (
        <Button onClick={clickHandler} {...rest}>
            <Heart fill='#fff' />
        </Button>
    )
}
