import { useQuery } from "@tanstack/react-query"
import { grenadeApi, GrenadesList } from "@entities/grenade"

export function GrenadesWidget() {
    const { data = [] } = useQuery(grenadeApi.getGrenades())

    return (
        <>
            <GrenadesList grenades={data} />
        </>
    )
}
