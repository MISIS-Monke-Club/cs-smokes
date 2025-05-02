import { useQuery } from "@tanstack/react-query"
import { grenadeApi, GrenadesListComponent } from "@entities/grenade"
import { grenadesMaper } from "@entities/grenade"

export function GrenadesList() {
    const {
        data: grenades,
        isLoading,
        isError,
    } = useQuery({
        queryKey: [...grenadeApi.baseKey, "list"],
        queryFn: grenadeApi.getGrenades,
    })

    return (
        <GrenadesListComponent
            grenades={grenades}
            isError={isError}
            isLoading={isLoading}
            mapFunction={grenadesMaper}
        />
    )
}
