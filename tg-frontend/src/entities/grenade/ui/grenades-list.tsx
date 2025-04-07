import { GrenadeModel } from "../domain"
import { grenadesMaper } from "../lib/grenade-maper"
import { Maper } from "@shared/model"
import { ItemsList } from "@shared/ui/items-list"
import { PlaceholderBlock } from "@shared/ui/placeholder-block"

type GrenadesListProps = {
    grenades?: GrenadeModel[]
    mapFunction?: Maper<GrenadeModel>
    isError?: boolean
}

export function GrenadesList({
    grenades,
    mapFunction = grenadesMaper,
    isError,
}: GrenadesListProps) {
    if (isError) {
        return (
            <PlaceholderBlock>
                Something went wrong in grenades list...
            </PlaceholderBlock>
        )
    }

    if (!grenades || grenades.length === 0) {
        return <PlaceholderBlock />
    }

    return <ItemsList elements={grenades} mapFunction={mapFunction} />
}
