import { mapsMaper } from "../../lib/maper"
import { MapModel } from "../../model/domain"
import { PlaceholderBlock } from "@shared/ui/placeholder-block"
import { ItemsList } from "@shared/ui/items-list"
import { Maper } from "@shared/model"
import { ComponentsRepeater } from "@shared/ui/components-repeater"
import { Skeleton } from "@shared/ui/skeleton"

type MapsListProps = {
    maps?: MapModel[]
    mapFunction?: Maper<MapModel>
    isLoading?: boolean
}

export function MapsList({
    maps = [],
    mapFunction = mapsMaper,
    isLoading = false,
}: MapsListProps) {
    if (isLoading) {
        return (
            <ItemsList type='grid' isLoading>
                <ComponentsRepeater length={20}>
                    <Skeleton />
                </ComponentsRepeater>
            </ItemsList>
        )
    }

    if (maps.length === 0) {
        return (
            <PlaceholderBlock>
                Something went wrong, no maps was provided
            </PlaceholderBlock>
        )
    }

    return <ItemsList type='grid' elements={maps} mapFunction={mapFunction} />
}
