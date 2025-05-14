import { useQuery } from "@tanstack/react-query"
import classes from "./maps.module.scss"
import { mapApi, MapsList } from "@entities/map"
import { mapsMaper } from "@entities/map"
import { Input } from "@shared/ui/input"

export function Maps() {
    const { data: maps, isLoading } = useQuery(mapApi.getMapsOptions())

    return (
        <>
            <h1 className={classes.title}>Select map</h1>
            <Input placeholder='Find your map...' />
            <MapsList
                maps={maps}
                mapFunction={mapsMaper}
                isLoading={isLoading}
            />
        </>
    )
}
