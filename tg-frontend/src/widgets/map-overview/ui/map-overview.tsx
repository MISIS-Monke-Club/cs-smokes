import { useQuery } from "@tanstack/react-query"
import classes from "./map-overview.module.scss"
import { GrenadesListComponent } from "@entities/grenade"
import { mapApi, MapPageModel } from "@entities/map"
import { PlaceholderBlock } from "@shared/ui/placeholder-block"
import { ImageComponent } from "@shared/ui/image"
import { ItemsList } from "@shared/ui/items-list"
import { favoritesMaper } from "@features/favorites/add"

export function MapOverview({ mapId }: { mapId: MapPageModel["mapId"] }) {
    const { data, isError, isLoading } = useQuery(mapApi.getMapById(mapId))

    if (isLoading) {
        return <ItemsList isLoading loadingItemsLength={15} />
    }

    if (!data && !isError) {
        return <div>Unexpected state...</div>
    }

    if (isError) {
        return (
            <PlaceholderBlock>
                Error acquired while getting data about map from server(
            </PlaceholderBlock>
        )
    }

    if (!data) {
        return <div>Something went wrong</div>
    }

    return (
        <>
            <h1 className={classes.title}>{data?.name}</h1>
            <ImageComponent
                className={classes.mapImage}
                src={data?.imageLink || ""}
                alt='card image'
                width='200'
                height='200'
                isLoading={isLoading}
            />
            <GrenadesListComponent
                grenades={data.mapLineups}
                mapFunction={favoritesMaper}
                isLoading={isLoading}
                isError={isError}
            />
        </>
    )
}
