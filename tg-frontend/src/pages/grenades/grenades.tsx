import { useQuery } from "@tanstack/react-query"
import { useDebouncedCallback } from "use-debounce"
import classes from "./grenades.module.scss"
import { grenadeApi, GrenadesListComponent } from "@entities/grenade"
import { favoritesMaper } from "@features/favorites/get"
import { Input } from "@shared/ui/input"
import { useQueryPrams } from "@shared/lib/params-parser"

export function GrenadesPage() {
    const { addParams, deleteParams, params } = useQueryPrams()
    const {
        data: grenades,
        isLoading,
        isError,
    } = useQuery(
        grenadeApi.getGrenadesOptions({
            query: params.get("search")?.toString(),
        })
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
            <h1 className={classes.title}>Grenades list</h1>
            <Input
                placeholder='Find your grenade...'
                onChange={(e) => handleChange(e.target.value)}
                defaultValue={params.get("search")?.toString()}
            />
            <GrenadesListComponent
                grenades={grenades}
                isLoading={isLoading}
                isError={isError}
                mapFunction={favoritesMaper}
            />
        </>
    )
}
