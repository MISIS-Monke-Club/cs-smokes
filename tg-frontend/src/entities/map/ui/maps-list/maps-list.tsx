import { useQuery } from "@tanstack/react-query"
import { mapsMaper } from "../../lib/maper"
import { MapModel } from "../../model"
import { mapApi } from "../../"
import { PlaceholderBlock } from "@shared/ui/placeholder-block"
import { ItemsList } from "@shared/ui/items-list"
import { Maper } from "@shared/model"
import { ComponentsRepeater } from "@shared/ui/components-repeater"
import { Skeleton } from "@shared/ui/skeleton"

type MapsListProps = {
    mapFunction?: Maper<MapModel>
}

export function MapsList({ mapFunction = mapsMaper }: MapsListProps) {
    const { data: maps = [], isLoading, isError } = useQuery(mapApi.getMaps())

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

    if (isError) {
        return (
            <PlaceholderBlock>Error acquired in maps list...</PlaceholderBlock>
        )
    }

    return <ItemsList type='grid' elements={maps} mapFunction={mapFunction} />
}
