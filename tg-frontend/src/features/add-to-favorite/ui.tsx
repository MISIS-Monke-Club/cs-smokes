import { Heart } from "lucide-react"
import { toast } from "sonner"
import { useAddToFavorites } from "./lib/add-to-favorites-hook"
import { Button } from "@shared/ui/button"
import { GrenadeModel } from "@entities/grenade"

export function AddToFavorite({ grenadeId }: Pick<GrenadeModel, "grenadeId">) {
    const { addToFavorites, isMutationPending } = useAddToFavorites()

    function clickHandler(e: React.MouseEvent<HTMLButtonElement>) {
        e.stopPropagation()

        addToFavorites({ grenadeId }).catch((err) => {
            console.error(err)
            toast.error("cant add this grenade to favorites")
        })
    }

    return (
        <Button
            onClick={clickHandler}
            isLoading={isMutationPending}
            disabled={isMutationPending}
            variant='outline'
            size='icon'
        >
            <Heart />
        </Button>
    )
}
