import { Heart } from "lucide-react"
import { toast } from "sonner"
import { useAddToFavorites } from "../lib/add-to-favorites-hook"
import { Button } from "@shared/ui/button"
import { GrenadeModel } from "@entities/grenade"

type AddToFavoritesProps = Pick<GrenadeModel, "grenadeId"> &
    React.ComponentProps<"button">

export function AddToFavorite({ grenadeId, ...rest }: AddToFavoritesProps) {
    const { addToFavorites, isMutationPending } = useAddToFavorites()

    function addToFavoriteHandler(e: React.MouseEvent<HTMLButtonElement>) {
        e.stopPropagation()

        addToFavorites({ grenadeId }).catch((err) => {
            console.error(err)
            toast.error("cant add this grenade to favorites")
        })
    }

    return (
        <Button
            onClick={addToFavoriteHandler}
            isLoading={isMutationPending}
            disabled={isMutationPending}
            variant='outline'
            size='icon'
            {...rest}
        >
            <Heart />
        </Button>
    )
}
