import { GrenadeModel } from "../domain"
import { Maper } from "@shared/model"
import { ItemsList } from "@shared/ui/items-list"
import { PlaceholderBlock } from "@shared/ui/placeholder-block"

type GrenadesListProps = {
    grenades?: GrenadeModel[]
    mapFunction: Maper<GrenadeModel>
}

export function GrenadesList({ grenades, mapFunction }: GrenadesListProps) {
    if (!grenades || grenades.length === 0) {
        return <PlaceholderBlock />
    }

    return <ItemsList elements={grenades} mapFunction={mapFunction} />
}
