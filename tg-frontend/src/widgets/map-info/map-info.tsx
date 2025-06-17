import { useQuery } from "@tanstack/react-query"
import { Slash } from "lucide-react"
import { Link } from "react-router-dom"
import classes from "./map-info.module.scss"
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbSeparator,
} from "@shared/ui/breadcrumb"
import { GoBack } from "@features/go-back"
import { mapApi, MapId } from "@entities/map"
import { ImageComponent } from "@shared/ui/image"
import { Button } from "@shared/ui/button"

export function MapInfo({ mapId }: { mapId: MapId }) {
    const { data, isLoading } = useQuery(mapApi.getMapByIdOptions(mapId))

    if (isLoading) {
        return <div>Loading...</div>
    }

    if (!data) {
        return <div>something went wrong...ƒ</div>
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
            <GoBack className={classes.goBack} />
            <h1 className={classes.title}>{data?.name}</h1>
            <ImageComponent
                className='rounded-[8px]'
                skeletonClasses='rounded-[8px]'
                url={data?.imageLink}
            />
            <Button asChild className={classes.accentAction}>
                <Link to='grenades'>view map lineups</Link>
            </Button>
            <Button asChild className={classes.action}>
                <Link to={data.link?.toString() || "."}>
                    read more about map
                </Link>
            </Button>
        </>
    )
}
