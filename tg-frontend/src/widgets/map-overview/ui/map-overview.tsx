import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { Slash } from "lucide-react"
import classes from "./map-overview.module.scss"
import { GrenadesListComponent } from "@entities/grenade"
import { mapApi, MapPageModel } from "@entities/map"
import { PlaceholderBlock } from "@shared/ui/placeholder-block"
import { ItemsList } from "@shared/ui/items-list"
import { favoritesMaper } from "@features/favorites/get"
import { Button } from "@shared/ui/button"
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbSeparator,
} from "@shared/ui/breadcrumb"

export function MapOverview({ mapId }: { mapId: MapPageModel["mapId"] }) {
    const { data, isError, isLoading } = useQuery(
        mapApi.getMapByIdOptions(mapId)
    )

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
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <Link to='/maps'>Maps</Link>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator>
                        <Slash />
                    </BreadcrumbSeparator>
                    <BreadcrumbItem>
                        <Link to={`/maps/${data.mapId}`}>{data.name}</Link>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator>
                        <Slash />
                    </BreadcrumbSeparator>
                    <BreadcrumbItem>
                        <Link to={`/maps/${data.mapId}/grenades`}>lineups</Link>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className={classes.heading}>
                <h1>{data?.name} lineups</h1>
                <Button asChild variant='link' className={classes.link}>
                    <Link to={`/maps/${data.mapId}`}>view map information</Link>
                </Button>
            </div>
            <GrenadesListComponent
                grenades={data.mapLineups}
                mapFunction={favoritesMaper}
                isLoading={isLoading}
                isError={isError}
            />
        </>
    )
}
