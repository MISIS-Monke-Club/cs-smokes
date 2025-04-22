import { AddToFavorite } from "../ui/add-to-favorites"
import { Grenade, GrenadeModel } from "@entities/grenade"
import { Maper } from "@shared/model"

export const maper: Maper<GrenadeModel> = (elements) => (
    <>
        {elements.map((el) => (
            <Grenade
                key={el.grenadeId}
                grenade={el}
                bottomSlot={<AddToFavorite grenadeId={el.grenadeId} />}
            />
        ))}
    </>
)
