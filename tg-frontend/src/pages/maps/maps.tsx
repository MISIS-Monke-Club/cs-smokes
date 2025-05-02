import { useQuery } from "@tanstack/react-query"
import { mapApi, MapsList } from "@entities/map"
import { mapsMaper } from "@entities/map"

export function Maps() {
    const { data: maps, isLoading } = useQuery(mapApi.getMapsOptions())

    return (
        <>
            <h1>Maps list</h1>
            <MapsList
                maps={maps}
                mapFunction={mapsMaper}
                isLoading={isLoading}
            />
        </>
    )
}
