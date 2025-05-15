import { useDebouncedCallback } from "use-debounce"
import { GrenadesSortings } from "../sortings"
import classes from "./grenades.module.scss"
import { Input } from "@shared/ui/input"
import { useQueryPrams } from "@shared/lib/params-parser"
import { GrenadesListWidget } from "@widgets/grenades-list-widget"

export function GrenadesPage() {
    const { addParams, deleteParams, params } = useQueryPrams()

    // Will hold execution for 300ms
    const handleInputChange = useDebouncedCallback((val: string) => {
        if (val.length !== 0) {
            addParams("search", val)
        } else {
            deleteParams("search")
        }
    }, 300)

    return (
        <>
            <h1 className={classes.title}>Grenades list</h1>
            <GrenadesSortings />
            <Input
                placeholder='Find your grenade...'
                onChange={(e) => handleInputChange(e.target.value)}
                defaultValue={params.get("search")?.toString()}
            />
            <GrenadesListWidget />
        </>
    )
}
