import { AddToFavorite } from "../ui"
import { Grenade, GrenadeModel } from "@entities/grenade"
import { Maper } from "@shared/model"

export const grenadeWithFavoriteMaper: Maper<GrenadeModel> = (elements) => (
    <>
        {elements.map((el) => (
            <Grenade
                key={crypto.randomUUID()}
                grenade={el}
                bottomSlot={<AddToFavorite grenadeId={el.grenadeId} />}
            />
        ))}
    </>
)
