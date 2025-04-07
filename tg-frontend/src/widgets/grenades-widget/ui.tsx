import { useQuery } from "@tanstack/react-query"
import { grenadeApi, GrenadesList } from "@entities/grenade"
import { grenadeWithFavoriteMaper } from "@features/add-to-favorite"

export function GrenadesWidget() {
    const { data = [] } = useQuery(grenadeApi.getGrenades())

    return (
        <GrenadesList grenades={data} mapFunction={grenadeWithFavoriteMaper} />
    )
}
