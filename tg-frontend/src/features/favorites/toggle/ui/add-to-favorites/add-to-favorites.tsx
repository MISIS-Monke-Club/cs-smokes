import { Heart } from "lucide-react"
import { useCallback } from "react"
import { useAddFavorite } from "../../lib/add-to-favorites/use-add-favorite"
import { Button } from "@shared/ui/button"
import { GrenadeModel } from "@entities/grenade"

type DeleteFromFavoritesProps = Pick<GrenadeModel, "grenadeId"> &
    React.ComponentProps<"button">

export function AddToFavorites({
    grenadeId,
    ...rest
}: DeleteFromFavoritesProps) {
    const { addToFavorites, getIsPending } = useAddFavorite({
        grenadeId,
    })

    const clickHandler = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation()

            if (!getIsPending(grenadeId)) {
                // None of actions is running right now
                addToFavorites()
            }
        },
        [addToFavorites, getIsPending, grenadeId]
    )

    return (
        <Button
            className='bg-[var(--background)]'
            onClick={clickHandler}
            variant='outline'
            size='icon'
            {...rest}
            data-testid='add-to-favorites-button'
        >
            <Heart />
        </Button>
    )
}
