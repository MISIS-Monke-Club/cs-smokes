import { mapsMaper } from "../../lib/maper"
import { MapModel } from "../../model/domain"
import classes from "./maps-list.module.scss"
import { PlaceholderBlock } from "@shared/ui/placeholder-block"
import { ItemsList } from "@shared/ui/items-list"
import { Maper } from "@shared/model"
import { CardComponent } from "@shared/ui/card"

type MapsListProps = {
    maps?: MapModel[]
    mapFunction?: Maper<MapModel>
    isLoading?: boolean
    isError?: boolean
}

export function MapsList({
    maps = [],
    mapFunction = mapsMaper,
    isError = false,
    ...rest
}: MapsListProps) {
    if (isError) {
        return (
            <PlaceholderBlock>
                Error acquired while getting maps list
            </PlaceholderBlock>
        )
    }

    if (maps.length === 0) {
        return (
            <PlaceholderBlock>
                Something went wrong, no maps was provided
            </PlaceholderBlock>
        )
    }

    return (
        <ItemsList
            type='grid'
            elements={maps}
            mapFunction={mapFunction}
            customColumnsClassName={classes.columnsDisplay}
            displayedLoadingItem={<CardComponent isLoading heading='text' />}
            {...rest}
        />
    )
}
