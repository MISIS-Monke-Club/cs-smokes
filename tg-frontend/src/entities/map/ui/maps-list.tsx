import { mapsMaper } from "../lib/maper"
import { MapModel } from "../model"
import { PlaceholderBlock } from "@shared/ui/placeholder-block"
import { ItemsList } from "@shared/ui/items-list"
import { Maper } from "@shared/model"

type MapsListProps = {
    maps: MapModel[]
    mapFunction?: Maper<MapModel>
    isError?: boolean
}

export function MapsList({
    maps,
    mapFunction = mapsMaper,
    isError,
}: MapsListProps) {
    if (maps.length === 0) {
        return <PlaceholderBlock></PlaceholderBlock>
    }

    if (isError) {
        return (
            <PlaceholderBlock>Error acquired in maps list...</PlaceholderBlock>
        )
    }

    return <ItemsList type='grid' elements={maps} mapFunction={mapFunction} />
}
