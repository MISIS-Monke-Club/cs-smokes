import { useQuery } from "@tanstack/react-query"
import classes from "./grenades.module.scss"
import { grenadeApi, GrenadesListComponent } from "@entities/grenade"
import { favoritesMaper } from "@features/favorites/get"
import { Input } from "@shared/ui/input"

export function GrenadesPage() {
    const {
        data: grenades,
        isLoading,
        isError,
    } = useQuery(grenadeApi.getGrenadesOptions())

    return (
        <>
            <h1 className={classes.title}>Grenades list</h1>
            <Input placeholder='Find your grenade...' />
            <GrenadesListComponent
                grenades={grenades}
                isLoading={isLoading}
                isError={isError}
                mapFunction={favoritesMaper}
            />
        </>
    )
}
