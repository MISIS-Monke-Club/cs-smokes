import { ToggleFavorites } from "./sub-features/toggle/ui/toggle-favorites"
import { Grenade, GrenadeModel } from "@entities/grenade"
import { Maper } from "@shared/model"

export const maper: Maper<GrenadeModel> = (elements) => (
    <>
        {elements.map((el) => (
            <Grenade
                key={el.grenadeId}
                grenade={el}
                bottomSlot={<ToggleFavorites grenadeId={el.grenadeId} />}
            />
        ))}
    </>
)
