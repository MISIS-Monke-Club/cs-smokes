import { useQuery } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import classes from "./ui.module.scss"
import { grenadesMaper, GrenadesList } from "@entities/grenade"
import { getFavoritesApi } from "@features/get-favorite-lineups"
import { selectUserId } from "@entities/session"

export function FavoritesPage() {
    const userId = useSelector(selectUserId)

    const { data } = useQuery(
        getFavoritesApi.getFavoriteLineupsByUserId(userId)
    )

    return (
        <>
            <h1 className={classes.title}>Favorites</h1>
            <GrenadesList grenades={data} mapFunction={grenadesMaper} />
        </>
    )
}
