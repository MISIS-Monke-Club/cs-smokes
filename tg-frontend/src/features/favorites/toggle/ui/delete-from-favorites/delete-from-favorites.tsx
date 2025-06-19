import { Heart } from "lucide-react"
import { useCallback } from "react"
import { useDeleteFavorite } from "../../lib/delete-from-favorites/use-delete-favorite"
import { Button } from "@shared/ui/button"
import { GrenadeModel } from "@entities/grenade"

type DeleteFromFavoritesProps = Pick<GrenadeModel, "grenadeId"> &
    React.ComponentProps<"button">

export function DeleteFromFavorites({
    grenadeId,
    ...rest
}: DeleteFromFavoritesProps) {
    const { deleteFromFavorites, getIsPending } = useDeleteFavorite({
        grenadeId,
    })

    const clickHandler = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation()

            if (!getIsPending(grenadeId)) {
                // None of actions is running right now
                deleteFromFavorites()
            }
        },
        [deleteFromFavorites, getIsPending, grenadeId]
    )

    return (
        <Button
            className='bg-[var(--background)]'
            onClick={clickHandler}
            variant='outline'
            size='icon'
            {...rest}
            data-testid='delete-from-favorites-button'
        >
            <Heart fill='#fff' />
        </Button>
    )
}
