import { mapsMaper } from "../lib/maper"
import { MapModel } from "../model"
import { PlaceholderBlock } from "@shared/ui/placeholder-block"
import { ItemsList } from "@shared/ui/items-list"

export function MapsList({ maps }: { maps: MapModel[] }) {
    if (maps.length === 0) {
        return <PlaceholderBlock></PlaceholderBlock>
    }

    return <ItemsList type='grid' elements={maps} mapFunction={mapsMaper} />
}
