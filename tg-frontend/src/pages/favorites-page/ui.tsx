import { useQuery } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import classes from "./ui.module.scss"
import { GrenadesListComponent } from "@entities/grenade"
import { getFavoritesApi } from "@features/favorites/sub-features/get"
import { selectUserId } from "@entities/session"
import { favoritesMaper } from "@features/favorites"

export function FavoritesPage() {
    const userId = useSelector(selectUserId)

    const { data: grenades } = useQuery(
        getFavoritesApi.getFavoriteLineupsByUserId(userId)
    )

    return (
        <>
            <h1 className={classes.title}>Favorites</h1>
            <GrenadesListComponent
                grenades={grenades}
                mapFunction={favoritesMaper}
            />
        </>
    )
}
