import { Heart } from "lucide-react"
import { useCallback } from "react"
import { useToggleFavorite } from "../lib/use-toggle-favorite"
import { Button } from "@shared/ui/button"
import { GrenadeModel } from "@entities/grenade"

type ToggleFavoritesProps = Pick<GrenadeModel, "grenadeId"> &
    React.ComponentProps<"button">

export function ToggleFavorites({ grenadeId, ...rest }: ToggleFavoritesProps) {
    const { toggleFavorite, isPending, currentState } = useToggleFavorite({
        grenadeId,
    })

    const clickHandler = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation()

            if (!isPending) {
                // None of actions is running right now
                toggleFavorite()
            }
        },
        [isPending, toggleFavorite]
    )

    return (
        <Button
            onClick={clickHandler}
            variant='outline'
            size='icon'
            {...rest}
            data-status={currentState}
            data-testid='favorites-toggle-button'
        >
            {currentState === "in-favorites" ? (
                <Heart fill='#fff' />
            ) : (
                <Heart />
            )}
        </Button>
    )
}
