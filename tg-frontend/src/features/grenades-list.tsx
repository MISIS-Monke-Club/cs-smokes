import { useQuery } from "@tanstack/react-query"
import { grenadeApi, GrenadesListComponent } from "@entities/grenade"

export function GrenadesList() {
    const {
        data: grenades,
        isError,
        isLoading,
    } = useQuery(grenadeApi.getGrenades())

    return (
        <GrenadesListComponent
            grenades={grenades}
            isError={isError}
            isLoading={isLoading}
            grenadesListId='allGrenadesActions'
        />
    )
}
