import { AddToFavorite } from "../ui/add-to-favorites"
import { DeleteFromFavorites } from "../../delete"
import { Grenade, GrenadeModel } from "@entities/grenade"
import { Maper } from "@shared/model"

export const maper: Maper<GrenadeModel> = (elements) => (
    <>
        {elements.map((el) => (
            <Grenade
                key={el.grenadeId}
                grenade={el}
                bottomSlot={
                    el.isFavorite ? (
                        <DeleteFromFavorites grenadeId={el.grenadeId} />
                    ) : (
                        <AddToFavorite grenadeId={el.grenadeId} />
                    )
                }
            />
        ))}
    </>
)
