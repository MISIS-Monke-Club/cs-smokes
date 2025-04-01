import { useQuery } from "@tanstack/react-query"
import classes from "./map-overview.module.scss"
import { GrenadesList } from "@entities/grenade"
import { mapApi, MapPageModel } from "@entities/map"
import { PlaceholderBlock } from "@shared/ui/placeholder-block"
import { ImageComponent } from "@shared/ui/image"

export function MapOverview({ mapId }: { mapId: MapPageModel["mapId"] }) {
    const { data, isError, isLoading } = useQuery(mapApi.getMapById(mapId))

    if (isLoading) {
        return <div>Loading...</div>
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
            <GrenadesList grenades={data?.mapLineups} />
        </>
    )
}
