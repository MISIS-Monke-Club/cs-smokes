import { useQuery } from "@tanstack/react-query"
import { useDebouncedCallback } from "use-debounce"
import { MapsSortings } from "../sortings/sortings"
import { MapsFilters } from "../filters/filters"
import classes from "./maps.module.scss"
import { mapApi, MapsList } from "@entities/map"
import { mapsMaper } from "@entities/map"
import { Input } from "@shared/ui/input"
import { useQueryPrams } from "@shared/lib/params-parser"

export function Maps() {
    const { addParams, deleteParams, params } = useQueryPrams()

    const { data: maps, isLoading } = useQuery(
        mapApi.getMapsOptions(Object.fromEntries(params.entries()))
    )

    // Will hold execution for 300ms
    const handleChange = useDebouncedCallback((val: string) => {
        if (val.length !== 0) {
            addParams("search", val)
        } else {
            deleteParams("search")
        }
    }, 300)

    return (
        <>
            <div className={classes.actions}>
                <MapsSortings />
                <MapsFilters />
            </div>
            <h1 className={classes.title}>Select map</h1>
            <Input
                placeholder='Find your map...'
                onChange={(e) => handleChange(e.target.value)}
                defaultValue={params.get("search")?.toString()}
            />
            <MapsList
                maps={maps}
                mapFunction={mapsMaper}
                isLoading={isLoading}
            />
        </>
    )
}
