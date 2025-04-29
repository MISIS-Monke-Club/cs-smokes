import { useQuery } from "@tanstack/react-query"
import { grenadeApi, GrenadeOverview } from "@entities/grenade"

export function GetGrenadeById({ grenadeId }: { grenadeId: number }) {
    const {
        data: grenade,
        isLoading,
        isError,
    } = useQuery(grenadeApi.getGrenadeById({ grenadeId }))

    return (
        <GrenadeOverview
            grenade={grenade}
            isError={isError}
            isLoading={isLoading}
        />
    )
}
